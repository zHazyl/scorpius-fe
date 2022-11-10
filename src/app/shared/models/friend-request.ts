import {ChatProfile} from './chat-profile';

export class FriendRequest {
  id: number;
  sender: ChatProfile;
  recipient: ChatProfile;
  sentTime: string;
}
