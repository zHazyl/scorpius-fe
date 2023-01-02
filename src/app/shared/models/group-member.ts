import { ChatProfile } from "./chat-profile";
import { GroupChat } from "./group-chat";

export class GroupMember {
    id?: number;
    group?: GroupChat;
    member?: ChatProfile;
    isAdmin?: boolean;
}