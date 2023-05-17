import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { RouterModule } from "@angular/router";
import { NgMultiSelectDropDownModule } from "ng-multiselect-dropdown";
import { DashboardModule } from "../dashboard/dashboard.module";
import { GlobalChatComponent } from "./global-chat.component";

@NgModule({
    declarations: [
        GlobalChatComponent
    ],
    imports: [
        CommonModule,
        DashboardModule,
        FormsModule,
        RouterModule,
        ReactiveFormsModule,
        NgMultiSelectDropDownModule
    ],
    exports: [
        GlobalChatComponent
    ]
})
export class GlobalChatModule {
}