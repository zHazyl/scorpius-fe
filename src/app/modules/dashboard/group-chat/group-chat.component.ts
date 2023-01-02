import { Subject } from 'rxjs';
import { Component, Input, OnInit } from '@angular/core';
import { ChatMessage } from 'src/app/shared/models/chat-message';
import { GroupChat } from 'src/app/shared/models/group-chat';
import { GroupMember } from 'src/app/shared/models/group-member';
import { ChatMessageService } from 'src/app/shared/services/chat-message.service';
import { AuthService } from 'src/app/shared/services/auth.service';
import { UserService } from 'src/app/shared/services/user.service';
import { ChatMessagesStatus } from 'src/app/shared/enum/chat-messages-status';
import {first} from 'rxjs/operators';
import { IUser} from 'src/app/shared/models/iuser';

@Component({
  selector: 'app-group-chat',
  templateUrl: './group-chat.component.html',
  styleUrls: ['./group-chat.component.css']
})
export class GroupChatComponent implements OnInit {

  @Input('isNewMessage') isNewMessage: Subject<ChatMessage>;
  @Input('onClickComponent') onClickComponent: Subject<number>;
  @Input('conversation') groupChat: GroupChat;
  // @Input('groupMembers') groupMembers: GroupMember[] = [];
  currentGroupChat: number;
  lastMessage = {} as ChatMessage;
  // membersInfo: {[id: string]: IUser} = {};
  showLoadingSpinner = false;

  constructor(private messageService: ChatMessageService,
    private authService: AuthService,
    private userService: UserService) { }

  ngOnInit(): void {
    // this.showLoadingSpinner = true;
    this.getLastMessage();
    this.isNewMessage.subscribe(newMessage => {
      if (this.groupChat.id.toString() === newMessage.recipient) {
        this.lastMessage = newMessage;
      }
    });
    this.onClickComponent.subscribe(groupChatId => {
      this.currentGroupChat = groupChatId;
      this.markMessageAsDelivered();
    });
    // this.getGroupMembersInfo();
  }

  // private getGroupMembersInfo() {
  //   this.groupMembers.forEach(member => {
  //     this.userService.getUser(member.member.userId)
  //     .subscribe(userInfo => {
  //       this.membersInfo[member.member.userId] = {name: userInfo.firstName + userInfo.lastName};
  //     })
  //   });
  // }

  showNotification(): boolean {
    if (this.currentGroupChat === this.groupChat.id) {
      return false;
    } else {
      return this.lastMessage.status === ChatMessagesStatus.received && this.lastMessage.recipient === this.groupChat.id.toString();
    }
  }

  getLastMessage() {
    this.showLoadingSpinner = true;
    this.messageService.getLastGroupMessages(1, this.groupChat.id).pipe(first())
    .subscribe(result => {
      if (result.length !== 0) {
        this.showLoadingSpinner = false;
        this.lastMessage = result[0];
      }
    }, erroObject => {
      this.showLoadingSpinner = false
    })
  }

  // getName(id: string) : string{
  //   return this.membersInfo[id].name;
  // }

  markMessageAsDelivered() {
      // this.lastMessage.status = "DELIVERIED";
  }

}
