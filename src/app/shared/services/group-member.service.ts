import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { environment } from "src/environments/environment";
import { GroupMember } from "../models/group-member";

@Injectable({providedIn: 'root'})
export class GroupMemberService {
    private groupMemberResource = '/group-member';

    constructor(private http: HttpClient) {

    }

    getGroupMembers(id: number) {
        return this.http.get<GroupMember[]>(environment.baseApiUrl + environment.chatServiceResource + this.groupMemberResource + '/' + id);
    }

    addMembers(members: GroupMember[]) {
        return this.http.post<GroupMember[]>(environment.baseApiUrl + environment.chatServiceResource + this.groupMemberResource, JSON.stringify(members))
    }

}