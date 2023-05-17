import { HttpClient, HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { environment } from "src/environments/environment";
import { GroupMember } from "../models/group-member";

@Injectable({providedIn: 'root'})
export class GroupMemberService {
    private groupMemberResource = '/group-member';

    constructor(private http: HttpClient) {

    }

    getGroupMembers(id: number) : Observable<any> {
        return this.http.get(environment.baseApiUrl + environment.groupServiceResource + this.groupMemberResource + '/' + id);
    }

    addMembers(members: GroupMember[]) {
        return this.http.post<GroupMember[]>(environment.baseApiUrl + environment.groupServiceResource + this.groupMemberResource, members)
    }

    deleteFriend(groupId, memberId) {
        const params = new HttpParams()
          .set('group_id', groupId)
          .set('member_id', memberId);
        return this.http.delete(environment.baseApiUrl + environment.groupServiceResource + this.groupMemberResource
          + '?' + params.toString());
      }

}
