import { Component, ElementRef, OnInit, ViewChild } from "@angular/core";
import { Router } from "@angular/router";
import { AngularFireStorage } from "angularfire2/storage";
import { Subject } from "rxjs";
import { ChatMessagesStatus } from "src/app/shared/enum/chat-messages-status";
import { ChatMessage } from "src/app/shared/models/chat-message";
import { AuthService } from "src/app/shared/services/auth.service";
import { ChatMessageService } from "src/app/shared/services/chat-message.service";
import { WsMessagesService } from "src/app/shared/services/ws-messages.service";

@Component({
  selector: 'app-global-chat',
  templateUrl: './global-chat.component.html',
  styleUrls: ['./global-chat.component.css']
})
export class GlobalChatComponent implements OnInit {

  @ViewChild('inputMessage') inputMessage: ElementRef;

  isNewMessage: Subject<ChatMessage> = new Subject();
  globalChatId = '';
  globalMessageList: ChatMessage[] = [];
  private shouldScrollToBottomAfterSendMessage = false;
  path: String = null;

  constructor(
    private authService: AuthService,
    private chatMessageService: ChatMessageService,
    private wsMessagesService: WsMessagesService,
    private router: Router,
    private af: AngularFireStorage
  ) {

  }

  ngOnInit(): void {
    
  }

  onScrollMessages(event: Event) {
    // @ts-ignore
    if (event.target.scrollTop === 0) {
      // @ts-ignore
      this.scrollDivMessagePosition = event.target.scrollHeight;
      this.getPreviousGroupMessages();
    }
  }

  getPreviousGroupMessages() {
    // this.chatMessageService.getPreviousGroupMessages(10, this.globalChatId,
    //   new Date(this.globalMessageList[0].time).toISOString())
    //   .subscribe(result => {
    //     result.forEach(message => {
    //       //unshift: add to begining
    //       this.globalMessageList.unshift(message);
    //     });
    //   });
  }

  scrollChatMessage() {
    // scroll to bottom after send chat-message
    // if (this.shouldScrollToBottomAfterSendMessage) {
    //   this.groupMessageContainer.nativeElement.scrollTop = this.groupMessageContainer.nativeElement.scrollHeight;
    //   this.shouldScrollToBottomAfterSendMessage = false;
    //   return;
    // }

    // if (this.scrollDivMessagePosition !== null && this.scrollDivMessagePosition < this.groupMessageContainer.nativeElement.scrollHeight) {
    //   this.groupMessageContainer.nativeElement.scrollTop = this.groupMessageContainer.nativeElement.scrollHeight - this.scrollDivMessagePosition;
    // } else {
    //   this.groupMessageContainer.nativeElement.scrollTop = this.groupMessageContainer.nativeElement.scrollHeight;
    // }
  }

  sentMessage() {
    let messageContent = this.inputMessage.nativeElement.value;
    // delete EOL
    if (messageContent.substr(messageContent.length - 1) === '\n') {
      messageContent = messageContent.slice(0, -1);
    }
    var friendchat: Number;
    var recipient: String;
    
    if (messageContent !== '' || 0 !== messageContent.length || this.path !== null) {
      const message = {
        friendChat: friendchat,
        sender: 'anonymus',
          // this.authService.currentUserValue.id != null
          //   ? this.authService.currentUserValue.id
          //   : 'anonymus',
        recipient: 'global',
        content: messageContent,
        status: ChatMessagesStatus.received,
        time: new Date().toISOString(),
        type: null
      } as ChatMessage;
      // if (this.path !== null) {
      //   message.type = 'image';
      //   this.af.upload("/" + message.time, this.path).then(() => {
      //     this.path = null;
      //     this.wsMessagesService.sendMessage(message);
      //     this.inputMessage.nativeElement.value = '';
  
      //     this.isNewMessage.next(message);
      //     this.shouldScrollToBottomAfterSendMessage = true;
      //   })
      //   return;
      // }
      // else {
        this.globalMessageList.push(message);
        // this.wsMessagesService.sendMessage(message);
        this.inputMessage.nativeElement.value = '';

        // this.isNewMessage.next(message);
        this.shouldScrollToBottomAfterSendMessage = true;
      // }
    } else {
      this.inputMessage.nativeElement.value = '';
    }

  }

  upload($event) {
    this.path = $event.target.files[0];
    $event.target.files.value = null;
    this.sentMessage();
  }

}
