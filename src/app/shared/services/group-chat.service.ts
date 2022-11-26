import {Injectable} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {environment} from '../../../environments/environment';
import {GroupChat} from '../models/group-chat';
import { Observable } from 'rxjs';

@Injectable({providedIn: 'root'})
export class GroupChatService {

  private groupChatResource = '/group-chats';

  constructor(private http: HttpClient) {
  }


  getGroupsChats() {
    return this.http.get<GroupChat[]>(environment.baseApiUrl + environment.chatServiceResource + this.groupChatResource);
  }

  createGroupChat(group: GroupChat) {
    return this.http.post(environment.baseApiUrl + environment.chatServiceResource + this.groupChatResource, JSON.stringify(group));
  }

//   deleteGroup(chatGroupId, chatGroupWithId) {
//     const params = new HttpParams()
//       .set('group_chat', chatGroupId)
//       .set('group_chat_with', chatGroupWithId);
//     return this.http.delete(environment.baseApiUrl + environment.chatServiceResource + this.groupChatResource
//       + '?' + params.toString());
//   }

}
