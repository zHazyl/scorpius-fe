import {AfterViewInit, Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {ChatMessage} from '../../../shared/models/chat-message';
import {AuthService} from '../../../shared/services/auth.service';
import { AngularFireStorage } from 'angularfire2/storage';
import { UserService } from 'src/app/shared/services/user.service';

@Component({
  selector: 'app-chat-message',
  templateUrl: './chat-message.component.html',
  styleUrls: ['./chat-message.component.css']
})
export class ChatMessageComponent implements OnInit, AfterViewInit {

  currentUserId: string;

  @Input('message')
  message: ChatMessage = null;

  @Output()
  afterRenderMessage: EventEmitter<any> = new EventEmitter<any>();

  name: string;

  constructor(private authService: AuthService,
    private af: AngularFireStorage,
    private userService: UserService) {
  }

  ngOnInit(): void {
    if (this.message.sender !== 'anonymus') {
      this.currentUserId = this.authService.currentUserValue.id;
    }
  }

  ngAfterViewInit(): void {
    // this.afterRenderMessage.emit();
    if (this.message.sender !== 'anonymus') {
      this.getUserName(this.message.sender);
    }
  }

  getImage(time) {
    time = time.replace(':','%3A');
    time = time.replace('+00:00', 'Z');
    let link = 'https://firebasestorage.googleapis.com/v0/b/scorpio-store-38761.appspot.com/o/'+ time + '?alt=media';
    return link;
  }
  getUserName(id: string){
    if (this.message.sender != this.message.recipient)
      this.userService.getUser(id).subscribe(user => {
        this.name =  user.firstName + ' ' + user.lastName;
      });
  }

}
