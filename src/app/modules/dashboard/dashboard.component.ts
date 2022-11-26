import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {AuthService} from '../../shared/services/auth.service';
import {Router} from '@angular/router';
import {first} from 'rxjs/operators';
import {ChatMessageService} from '../../shared/services/chat-message.service';
import {ChatMessage} from '../../shared/models/chat-message';
import {WsMessagesService} from '../../shared/services/ws-messages.service';
import {AfterWebSocketConnected} from '../../shared/helpers/after-web-socket-connected';
import {UserService} from '../../shared/services/user.service';
import {User} from '../../shared/models/user';
import {FriendRequestService} from '../../shared/services/friend-request.service';
import {FriendRequest} from '../../shared/models/friend-request';
import {Subject} from 'rxjs';
import {ChatProfile} from '../../shared/models/chat-profile';
import {FriendChatService} from '../../shared/services/friend-chat.service';
import {FriendChat} from '../../shared/models/friend-chat';
import {ChatProfileService} from '../../shared/services/chat-profile.service';
import {ChatMessagesStatus} from '../../shared/enum/chat-messages-status';
import { AngularFireStorage } from 'angularfire2/storage';
import { GroupChat } from 'src/app/shared/models/group-chat';
import { GroupChatService } from 'src/app/shared/services/group-chat.service';
import { GroupMemberService } from 'src/app/shared/services/group-member.service';
import { GroupMember } from 'src/app/shared/models/group-member';


@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, AfterWebSocketConnected {

  @ViewChild('inputMessage') inputMessage: ElementRef;
  @ViewChild('friendCode') friendCode: ElementRef;
  @ViewChild('notification') notification: ElementRef;
  @ViewChild('messageContainer') messageContainer: ElementRef;
  @ViewChild('groupMessageContainer') groupMessageContainer: ElementRef;
  @ViewChild('appMessage') appMessage: ElementRef;
  @ViewChild('appGroupMessage') appGroupMessage: ElementRef;

  isNewMessage: Subject<ChatMessage> = new Subject();
  clickFriendComponent: Subject<number> = new Subject();
  clickGroupComponent: Subject<number> = new Subject();
  currentUser = {} as User;
  currentUserChatProfile = {} as ChatProfile;
  receivedFriendRequests: FriendRequest[] = [];
  sentFriendRequests: FriendRequest[] = [];
  currentRecipientUser = {} as User;
  notificationMessage = '';
  isActiveFriendComponent = true;
  isActiveGroupComponent = false;
  isActiveFriendRequestComponent = false;
  isActiveAddFriendComponent = false;
  isActiveSettingsComponent = false;
  showDeleteFriendPrompt = false;
  isNotificationVisible = false;
  friendsChats: FriendChat[] = [];
  groupsChats: GroupChat[] = [];
  messageList: ChatMessage[] = [];
  groupMessageList: ChatMessage[] = []
  currentFriendChat: FriendChat = null;
  currentGroupChat: GroupChat = null;
  scrollDivMessagePosition: number = null;
  private shouldScrollToBottomAfterSendMessage = false;
  private audio = new Audio();
  path: String = null;

  constructor(private authService: AuthService,
              private router: Router,
              private chatMessageService: ChatMessageService,
              private wsMessagesService: WsMessagesService,
              private userService: UserService,
              private friendRequestService: FriendRequestService,
              private chatProfileService: ChatProfileService,
              private friendChatService: FriendChatService,
              private groupChatService: GroupChatService,
              private groupMemberService: GroupMemberService,
              private af: AngularFireStorage) {
    wsMessagesService.connect(authService.getToken(), this);
    this.initAudioNotification();
  }

  ngOnInit(): void {
    this.getUserFriendsChats();
    this.getUserInformation();
    this.getUserChatProfile();
  }

  private getUserFriendsChats() {
    this.friendChatService.getFriendsChats().pipe(first())
      .subscribe(result => {
        this.friendsChats = result;
      });
  }

  private getUserGroupsChats() {
    this.groupChatService.getGroupsChats().pipe(first())
    .subscribe(result => {
      this.groupsChats = result;
    })
  }

  getPreviousMessages() {
    this.chatMessageService.getPreviousMessages(10, this.currentFriendChat.id, this.currentFriendChat.chatWith,
      new Date(this.messageList[0].time).toISOString())
      .subscribe(result => {
        result.forEach(message => {
          //unshift: add to begining
          this.messageList.unshift(message);
        });
      });
  }

  getPreviousGroupMessages() {
    this.chatMessageService.getPreviousGroupMessages(10, this.currentGroupChat.id,
      new Date(this.groupMessageList[0].time).toISOString())
      .subscribe(result => {
        result.forEach(message => {
          //unshift: add to begining
          this.groupMessageList.unshift(message);
        });
      });
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/']);
  }

  enterFriendChat(friendChatId: number) {
    this.currentFriendChat = this.friendsChats.filter(value => value.id === friendChatId)[0];
    this.getInitialMessages(this.currentFriendChat.id, this.currentFriendChat.chatWith);
    this.userService.getUser(this.currentFriendChat.recipient.userId)
      .subscribe(recipient => {
        this.currentRecipientUser = recipient;
      });
    this.clickFriendComponent.next(friendChatId);
  }

  enterGroupChat(groupChatId: number) {
    this.currentGroupChat = this.groupsChats.filter(value => value.id === groupChatId)[0];
    this.getInitialGroupMessages(this.currentGroupChat.id);
    this.clickGroupComponent.next(groupChatId);
    const that = this;
    this.wsMessagesService.ws.subscribe('/topic/' + this.currentGroupChat.id + '.messages',
    message => {
      let chatMessage: ChatMessage;
      chatMessage = JSON.parse(message.body);
      if (that.currentGroupChat !== null && chatMessage.recipient === that.currentGroupChat.id.toString()) {
        that.chatMessageService.markMessageAsDelivered(that.currentFriendChat.chatWith).subscribe(result => {
          chatMessage.status = ChatMessagesStatus.delivered;
          that.groupMessageList.push(chatMessage);
        });
      } else {
        that.audio.play()
          .then(_ => {
            // sound effect started
          }).catch(error => {
          // empty
        });
      }
      that.isNewMessage.next(chatMessage);
    });
  }

  getGroupMembers(groupId: number): GroupMember[] {
    var groupMembers: GroupChat[] = [];
    this.groupMemberService.getGroupMembers(groupId).pipe(first())
    .subscribe(result => {
      groupMembers = result;
    })
    return groupMembers;
  }


  getInitialMessages(friendChatId: number, friendChatWithId: number) {
    this.chatMessageService.getLastMessages(10, friendChatId, friendChatWithId).pipe(first())
      .subscribe(lastChatMessages => {
        lastChatMessages.sort((m1, m2) => m1.time.localeCompare(m2.time));
        this.messageList = lastChatMessages;
      });
  }

  getInitialGroupMessages(groupId: number) {
    this.chatMessageService.getLastGroupMessages(10, groupId).pipe(first())
    .subscribe(lastChatMessages => {
      lastChatMessages.sort((m1, m2) => m1.time.localeCompare(m2.time));
      this.groupMessageList = lastChatMessages;
    })
  }

  sentMessage() {
    let messageContent = this.inputMessage.nativeElement.value;
    // delete EOL
    if (messageContent.substr(messageContent.length - 1) === '\n') {
      messageContent = messageContent.slice(0, -1);
    }
    var friendchat: Number;
    var recipient: String;

    if (this.isActiveFriendComponent) {
      friendchat = this.currentFriendChat.id;
      recipient = this.currentFriendChat.recipient.userId;
    }
    if (this.isActiveGroupComponent) {
      friendchat = -1;
      recipient = this.currentGroupChat.id.toString();
    }

    if (messageContent !== '' || 0 !== messageContent.length || this.path !== null) {
      const message = {
        friendChat: friendchat,
        sender: this.authService.currentUserValue.id,
        recipient: recipient,
        content: messageContent,
        status: ChatMessagesStatus.received,
        time: new Date().toISOString(),
        type: null
      } as ChatMessage;
      if (this.path !== null) {
        message.type = 'image';
        this.af.upload("/" + message.time, this.path).then(() => {
          this.path = null;
          if (this.isActiveFriendComponent) {
            this.messageList.push(message);
          }
          if (this.isActiveGroupComponent) {
            this.groupMessageList.push(message);
          }
          this.wsMessagesService.sendMessage(message);
          this.inputMessage.nativeElement.value = '';
  
          this.isNewMessage.next(message);
          this.shouldScrollToBottomAfterSendMessage = true;
        })
        return;
      }
      else {
        this.messageList.push(message);
        this.wsMessagesService.sendMessage(message);
        this.inputMessage.nativeElement.value = '';

        this.isNewMessage.next(message);
        this.shouldScrollToBottomAfterSendMessage = true;
      }
    } else {
      this.inputMessage.nativeElement.value = '';
    }

  }

  scrollChatMessage() {
    // scroll to bottom after send chat-message
    if (this.shouldScrollToBottomAfterSendMessage) {
      this.messageContainer.nativeElement.scrollTop = this.messageContainer.nativeElement.scrollHeight;
      this.shouldScrollToBottomAfterSendMessage = false;
      return;
    }

    if (this.scrollDivMessagePosition !== null && this.scrollDivMessagePosition < this.messageContainer.nativeElement.scrollHeight) {
      this.messageContainer.nativeElement.scrollTop = this.messageContainer.nativeElement.scrollHeight - this.scrollDivMessagePosition;
    } else {
      this.messageContainer.nativeElement.scrollTop = this.messageContainer.nativeElement.scrollHeight;
    }
  }
  scrollGroupChatMessage() {
    // scroll to bottom after send chat-message
    if (this.shouldScrollToBottomAfterSendMessage) {
      this.groupMessageContainer.nativeElement.scrollTop = this.groupMessageContainer.nativeElement.scrollHeight;
      this.shouldScrollToBottomAfterSendMessage = false;
      return;
    }

    if (this.scrollDivMessagePosition !== null && this.scrollDivMessagePosition < this.groupMessageContainer.nativeElement.scrollHeight) {
      this.groupMessageContainer.nativeElement.scrollTop = this.groupMessageContainer.nativeElement.scrollHeight - this.scrollDivMessagePosition;
    } else {
      this.groupMessageContainer.nativeElement.scrollTop = this.groupMessageContainer.nativeElement.scrollHeight;
    }
  }

  //websock protocol
  wsAfterConnected() {
    const that = this;
    this.wsMessagesService.ws.subscribe('/topic/' + this.authService.currentUserValue.id + '.messages',
      message => {
        let chatMessage: ChatMessage;
        chatMessage = JSON.parse(message.body);
        if (that.currentFriendChat !== null && chatMessage.friendChat === that.currentFriendChat.chatWith) {
          that.chatMessageService.markMessageAsDelivered(that.currentFriendChat.chatWith).subscribe(result => {
            chatMessage.status = ChatMessagesStatus.delivered;
            that.messageList.push(chatMessage);
          });
        } else {
          that.audio.play()
            .then(_ => {
              // sound effect started
            }).catch(error => {
            // empty
          });
        }
        that.isNewMessage.next(chatMessage);
      });

  }

  showFriendRequestComponent() {
    this.friendRequestService.getReceivedFriendRequests()
      .subscribe(result => {
        this.receivedFriendRequests = result;
        this.isActiveFriendRequestComponent = true;
        this.isActiveFriendComponent = false;
        this.isActiveAddFriendComponent = false;
        this.isActiveSettingsComponent = false;
        this.isActiveGroupComponent = false;
      });
  }

  showFriendComponent() {
    this.isActiveFriendComponent = true;
    this.isActiveFriendRequestComponent = false;
    this.isActiveAddFriendComponent = false;
    this.isActiveSettingsComponent = false;
    this.isActiveGroupComponent = false;
    this.getUserFriendsChats();
    this.getUserInformation();
    this.getUserChatProfile();
    // this.currentFriendChat = null;
  }

  showGroupComponent() {
    this.isActiveGroupComponent = true;
    this.isActiveFriendComponent = false;
    this.isActiveFriendRequestComponent = false;
    this.isActiveAddFriendComponent = false;
    this.isActiveSettingsComponent = false;
    this.getUserGroupsChats();
    // this.currentGroupChat = null;

  }

  showAddFriendComponent() {
    this.friendRequestService.getSentFriendRequests()
      .subscribe(result => {
        this.sentFriendRequests = result;
        this.isActiveAddFriendComponent = true;
        this.isActiveFriendRequestComponent = false;
        this.isActiveFriendComponent = false;
        this.isActiveSettingsComponent = false;
        this.isActiveGroupComponent = false;
      });
  }

  showSettingsComponent() {
    this.isActiveFriendComponent = false;
    this.isActiveFriendRequestComponent = false;
    this.isActiveAddFriendComponent = false;
    this.isActiveSettingsComponent = true;
    this.currentFriendChat = null;
    this.isActiveGroupComponent = false;
  }

  private getUserInformation() {
    this.userService.getUser(this.authService.currentUserValue.id).subscribe(user => {
      this.currentUser = user;
    });
  }

  private getUserChatProfile() {
    this.chatProfileService.getChatProfile(this.authService.currentUserValue.id)
      .subscribe(userChatProfile => {
        this.currentUserChatProfile = userChatProfile;
      });
  }

  sendFriendRequest() {
    let invitationCode = this.friendCode.nativeElement.value;
    invitationCode = invitationCode.replace(/\s/g, '');
    if (invitationCode.length !== 0) {
      this.friendRequestService.postCreateNewFriendRequest(invitationCode)
        .subscribe(result => {
          this.sentFriendRequests.push(result);
          this.showNotificationMessage('We send a new friends request.');
        }, errorObject => {
          if (errorObject.status === 404 || errorObject.status === 400 || errorObject.status === 409) {
            this.showNotificationMessage(errorObject.error.detail);
          }
        });
      this.friendCode.nativeElement.value = '';
    }
  }

  initAudioNotification() {
    this.audio.src = '../../../assets/audio/notification_sound.mp3';
    this.audio.load();
  }

  showNotificationMessage(message) {
    this.notificationMessage = message;
    this.isNotificationVisible = true;
    setTimeout(() => {
      this.isNotificationVisible = false;
    }, 2500);
  }

  onDeletedFriendsRequest(resultMessage: string) {
    this.showNotificationMessage(resultMessage);
    this.showAddFriendComponent();
  }

  onReplyFriendsRequest(resultMessage: string) {
    this.showNotificationMessage(resultMessage);
    this.showFriendRequestComponent();
  }

  onScrollMessages(event: Event) {
    // @ts-ignore
    if (event.target.scrollTop === 0) {
      // @ts-ignore
      this.scrollDivMessagePosition = event.target.scrollHeight;
      if (this.isActiveFriendComponent)
        this.getPreviousMessages();
      else
        this.getPreviousGroupMessages();
    }
  }

  deleteFriendAlert() {
    this.showDeleteFriendPrompt = true;
  }

  deleteFriend() {
    this.friendChatService.deleteFriend(this.currentFriendChat.id, this.currentFriendChat.chatWith)
      .subscribe(result => {
        this.getUserFriendsChats();
        this.showDeleteFriendPrompt = false;
        this.currentFriendChat = null;
        this.showNotificationMessage('Friend has been removed.');
      });
  }

  cancelDeleteFriend() {
    this.showDeleteFriendPrompt = false;
  }

  upload($event) {
    this.path = $event.target.files[0];
    $event.target.files.value = null;
    this.sentMessage();
  }


}
