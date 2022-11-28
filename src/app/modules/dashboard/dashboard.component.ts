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
import { IDropdownSettings } from 'ng-multiselect-dropdown';
import { GroupMember } from 'src/app/shared/models/group-member';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, AfterWebSocketConnected {

  @ViewChild('inputMessage') inputMessage: ElementRef;
  @ViewChild('friendCode') friendCode: ElementRef;
  @ViewChild('groupName') groupName: ElementRef;
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
  isActiveAddGroupComponent = false;
  isActiveSettingsComponent = false;
  showDeleteFriendPrompt = false;
  showIsAdminPrompt = false;
  showMembersGroup = false;
  showAddMembers =false;
  isNotificationVisible = false;
  friendsChats: FriendChat[] = [];
  groupsChats: GroupChat[] = [];
  membersGroup: GroupMember[] = [];
  messageList: ChatMessage[] = [];
  groupMessageList: ChatMessage[] = []
  currentFriendChat: FriendChat = null;
  currentGroupChat: GroupChat = null;
  scrollDivMessagePosition: number = null;
  private shouldScrollToBottomAfterSendMessage = false;
  private audio = new Audio();
  path: String = null;
  dropdownList: any[] = [];
  dropdownSettings: IDropdownSettings = {};
  selectedItems = [];

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
    this.groupChatService.getGroupsChats().pipe(first())
    .subscribe(result => {
      this.groupsChats = result;
      wsMessagesService.connect(authService.getToken(), this);
    })
    this.initAudioNotification();
  }


  ngOnInit(): void {
    this.getUserFriendsChats();
    this.getUserInformation();
    this.getUserChatProfile();
    this.getUserFriendInfo();

    this.dropdownSettings = {
      idField: 'item_id',
      textField: 'item_text',
      allowSearchFilter: true,
      limitSelection: Number.MAX_VALUE
    };
  }

  onItemSelect(item: any) {
      console.log('onItemSelect', item);
      this.selectedItems.push(item);
      console.log(this.selectedItems);
      if (!this.showMembersGroup && !this.showAddMembers)
        this.showIsAdminPrompt = true;
  }
  onItemDeSelect(item: any) {
      this.selectedItems = this.selectedItems.filter(i => i.item_id != item.item_id)
      console.log('onItemDeSelect', item);
      console.log(this.selectedItems);
  }
  onSelectAll(items: any) {
      console.log('onSelectAll', items);
      this.selectedItems = items;
  }
  onUnSelectAll() {
      console.log('onUnSelectAll fires');
      this.selectedItems = [];
  }

  private getUserFriendsChats() {
    this.friendChatService.getFriendsChats().pipe(first())
      .subscribe(result => {
        this.friendsChats = result;
      });
  }

  private getUserFriendInfo() {
    const userLoads = this.friendsChats.map(friend => {
      const id = friend.recipient.userId;
      return this.loadUserInfo(id);
    });
    Promise.all(userLoads).then(result => {
      console.log(result)
      this.dropdownList = result;
    });
    
  }

  private getUserMembersInfo() {
    const userLoads = this.membersGroup.map(member => {
      const id = member.member.userId;
      return this.loadUserInfo(id);
    });
    Promise.all(userLoads).then(result => {
      console.log(result)
      this.dropdownList = result;
    });
    
  }

  private loadUserInfo(id: string): any {
    return new Promise((resolve, reject) => {
      this.userService.getUserObs(id).subscribe(result => {
        resolve({item_id: {id: id, isAdmin: false}, item_text: result.firstName + ' ' +  result.lastName});
      })
    })
  }

  getUserName(id: string): string {
    var name: string
    this.userService.getUser(id).pipe(first()).subscribe(user => {
      name = user.firstName + ' ' + user.lastName;
    });
    return name;
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
  }

  // getGroupMembers(groupId: number): GroupMember[] {
  //   var groupMembers: GroupChat[] = [];
  //   this.groupMemberService.getGroupMembers(groupId).pipe(first())
  //   .subscribe(result => {
  //     groupMembers = result;
  //   })
  //   return groupMembers;
  // }


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
            // this.groupMessageList.push(message);
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
      this.wsMessagesService.ws.subscribe('/topic/' + this.authService.currentUserValue.id + '.group',
      groupId => {
        this.wsMessagesService.ws.subscribe('/topic/' + groupId + '.messages',
        message => {
          let chatMessage: ChatMessage;
          chatMessage = JSON.parse(message.body);
          chatMessage.status = ChatMessagesStatus.delivered;
          that.groupMessageList.push(chatMessage);
          if (that.currentGroupChat !== null && chatMessage.recipient === that.currentGroupChat.id.toString()) {
              // that.chatMessageService.markMessageAsDelivered(that.currentFriendChat.chatWith).subscribe(result => {
    
              // });
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
      });
      this.groupsChats.forEach(group => {

        this.wsMessagesService.ws.subscribe('/topic/' + group.id + '.messages',
        message => {
          let chatMessage: ChatMessage;
          chatMessage = JSON.parse(message.body);
          chatMessage.status = ChatMessagesStatus.delivered;
          that.groupMessageList.push(chatMessage);
          if (that.currentGroupChat !== null && chatMessage.recipient === that.currentGroupChat.id.toString()) {
              // that.chatMessageService.markMessageAsDelivered(that.currentFriendChat.chatWith).subscribe(result => {
    
              // });
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

      })
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
        this.isActiveAddGroupComponent = false;
      });
  }

  showFriendComponent() {
    this.isActiveFriendComponent = true;
    this.isActiveFriendRequestComponent = false;
    this.isActiveAddFriendComponent = false;
    this.isActiveSettingsComponent = false;
    this.isActiveGroupComponent = false;
    this.isActiveAddGroupComponent = false;
    this.getUserFriendsChats();
    this.getUserInformation();
    this.getUserChatProfile();
    // this.currentFriendChat = null;
    this.currentGroupChat = null;
  }

  showGroupComponent() {
    this.isActiveGroupComponent = true;
    this.isActiveFriendComponent = false;
    this.isActiveFriendRequestComponent = false;
    this.isActiveAddFriendComponent = false;
    this.isActiveSettingsComponent = false;
    this.isActiveAddGroupComponent = false;
    this.getUserGroupsChats();
    // this.currentGroupChat = null;
    this.currentFriendChat = null
    this.getUserFriendsChats();
    // this.getUserInformation();
    // this.getUserChatProfile();
    this.getUserFriendInfo();
    this.selectedItems = [];
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
        this.isActiveAddGroupComponent = false;
      });
  }

  showAddGroupComponent() {
    this.isActiveAddGroupComponent = true;
    this.isActiveAddFriendComponent = false;
    this.isActiveFriendRequestComponent = false;
    this.isActiveFriendComponent = false;
    this.isActiveSettingsComponent = false;
    this.isActiveGroupComponent = false;
    this.getUserFriendsChats();
    // this.getUserInformation();
    // this.getUserChatProfile();
    this.getUserFriendInfo();
    this.selectedItems = [];
  }

  showSettingsComponent() {
    this.isActiveFriendComponent = false;
    this.isActiveFriendRequestComponent = false;
    this.isActiveAddFriendComponent = false;
    this.isActiveSettingsComponent = true;
    this.currentFriendChat = null;
    this.isActiveGroupComponent = false;
    this.isActiveAddGroupComponent = false;
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

  createGroup() {
    let groupName = this.groupName.nativeElement.value;
    var members = []
    if (groupName.length !== 0 && this.selectedItems.length > 0) {
      this.groupChatService.createGroupChat({groupName: groupName}).subscribe(result => {
        // console.log(this.selectedItems);
        
        this.selectedItems.forEach(item => {
          members.push(
            {        
              "group": {
                "id": result.id
              },
              "member": {
                  "userId": item.item_id.id
              },
              "admin": item.item_id.isAdmin});
        })
        // console.log(JSON.stringify(members))
        this.groupMemberService.addMembers(members).subscribe(result1 => {
          console.log(result1);
          // this.selectedItems.forEach(item => {
          //   this.wsMessagesService.sendNewGroup(item.item_id.id, result.id)
          // })
        })
        this.wsMessagesService.sendMessage(
          {
          friendChat: -1,
          sender: result.id.toString(),
          recipient: result.id.toString(),
          content: 'New group',
          status: ChatMessagesStatus.received,
          time: new Date().toISOString(),
          type: null
        })
        const that =  this;
        this.wsMessagesService.ws.subscribe('/topic/' + result.id + '.messages',
        message => {
          let chatMessage: ChatMessage;
          chatMessage = JSON.parse(message.body);
          chatMessage.status = ChatMessagesStatus.delivered;
          that.groupMessageList.push(chatMessage);
          if (that.currentGroupChat !== null && chatMessage.recipient === that.currentGroupChat.id.toString()) {
              // that.chatMessageService.markMessageAsDelivered(that.currentFriendChat.chatWith).subscribe(result => {
    
              // });
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
        this.showNotificationMessage('We created group');
      }, errorObject => {
        if (errorObject.status === 404 || errorObject.status === 400 || errorObject.status === 409) {
          this.showNotificationMessage(errorObject.error.detail);
        }
      })
    }
    else {
      this.showNotificationMessage("Can't create");
    }
    // this.onUnSelectAll();
  }


  addGroupMembers() {
    var members = []
    this.selectedItems.forEach(item => {
      members.push(
        {        
          "group": {
            "id": this.currentGroupChat.id
          },
          "member": {
              "userId": item.item_id.id
          },
          "admin": item.item_id.isAdmin});
    })
    // console.log(JSON.stringify(members))
    this.groupMemberService.addMembers(members).subscribe(result => {
      console.log(result);
      this.showNotificationMessage("Added");
      this.selectedItems.forEach(item => {
        // this.wsMessagesService.sendNewGroup(item.item_id.id, this.currentGroupChat.id)
        this.wsMessagesService.sendMessage(
          {
          friendChat: -1,
          sender: this.currentGroupChat.id.toString(),
          recipient: this.currentGroupChat.id.toString(),
          content: item.item_text + ' joined',
          status: ChatMessagesStatus.received,
          time: new Date().toISOString(),
          type: null
        })        
      })
    }, errorObject => {
      if (errorObject.status === 404 || errorObject.status === 400 || errorObject.status === 409) {
        this.showNotificationMessage(errorObject.error.detail);
      }
    })
  }

  deleteGroupMembers() {
    this.groupMemberService.deleteFriend(this.currentGroupChat.id, this.selectedItems[0].item_id.id).subscribe(result => {
      this.showNotificationMessage("Deleted member");
    }, errorObject => {
      if (errorObject.status === 404 || errorObject.status === 400 || errorObject.status === 409) {
        this.showNotificationMessage(errorObject.error.detail);
      }
    })
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

  membersAlert() {
    this.dropdownSettings.limitSelection = 1;
    this.groupMemberService.getGroupMembers(this.currentGroupChat.id).subscribe(result => {

      this.dropdownList = [];
      this.onUnSelectAll();
      this.membersGroup = result;
      this.getUserMembersInfo();
      this.showMembersGroup = true;
    }, errorObject => {
      if (errorObject.status === 404 || errorObject.status === 400 || errorObject.status === 409) {
        this.showNotificationMessage(errorObject.error.detail);
      }
    })
  }

  addMembersAlert() {
    this.dropdownList = [];
    this.onUnSelectAll();
    this.getUserFriendInfo();
    this.showAddMembers = true;
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

  notAdmin() {
    this.selectedItems[this.selectedItems.length - 1].item_id.isAdmin = false;
    this.showIsAdminPrompt = false;
  }

  closeMembersGroup() {
    this.showMembersGroup = false;
    this.showAddMembers = false;
    this.dropdownSettings.limitSelection =  Number.MAX_VALUE;
  }

  isAdmin() {
    this.selectedItems[this.selectedItems.length - 1].item_id.isAdmin = true;
    this.showIsAdminPrompt = false;
  }

  upload($event) {
    this.path = $event.target.files[0];
    $event.target.files.value = null;
    this.sentMessage();
  }


}
