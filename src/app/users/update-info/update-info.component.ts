import { Component, OnInit } from '@angular/core';
import { StringColumn, GridSettings } from 'radweb';
import { Helpers } from '../../helpers/helpers';
import { DialogService } from '../../select-popup/dialog';
import { AuthService } from '../../auth/auth-service';
import { foreachEntityItem } from '../../shared/utils';
import { LoggedInGuard } from '../../auth/auth-guard';
import { Route } from '@angular/router';

@Component({
  selector: 'app-update-info',
  templateUrl: './update-info.component.html',
  styleUrls: ['./update-info.component.scss']
})
export class UpdateInfoComponent implements OnInit {

  static route: Route = { path: 'update-info', component: UpdateInfoComponent, data: { name: 'הגדרות אישיות' }, canActivate: [LoggedInGuard] };
  
  confirmPassword = new StringColumn({ caption: 'אישור סיסמה', inputType: 'password', value: Helpers.emptyPassword });
  helpers = new GridSettings(new Helpers(), {
    numOfColumnsInGrid: 0,
    allowUpdate: true,
    get: { where: h => h.id.isEqualTo(this.auth.auth.info.helperId) },
    columnSettings: h => [
      h.name,
      h.phone,
      //h.userName,
      h.password,
      { column: this.confirmPassword },
      //h.email,
      //h.address
    ],

  });


  constructor(private dialog: DialogService,
    private auth: AuthService) {


  }

  ngOnInit() {
    this.helpers.getRecords().then(() => {
      if (!this.helpers.currentRow.password.value)
        this.confirmPassword.value = '';
    });
  }
  async register() {
    try {
      let passwordChanged = this.helpers.currentRow.password.value != this.helpers.currentRow.password.originalValue;
      let thePassword = this.helpers.currentRow.password.value;
      if (this.helpers.currentRow.password.value != this.confirmPassword.value) {
        this.dialog.Error('הסיסמה אינה תואמת את אישור הסיסמה');
      }
      else {

        await this.helpers.items[0].save();
        this.dialog.Info("העדכון נשמר, תודה");
        this.confirmPassword.value = this.helpers.currentRow.password.value ? Helpers.emptyPassword : '';
        if (passwordChanged) {
          this.auth.login(this.helpers.currentRow.phone.value, thePassword, false, () => { });
        }
      }
    }
    catch (err) {

    }

  }

}
