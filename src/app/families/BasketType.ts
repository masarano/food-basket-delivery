
import { IdEntity } from "../model-shared/types";
import { StringColumn } from "radweb";
import { evilStatics } from "../auth/evil-statics";
import { Id, HasAsyncGetTheValue } from "../model-shared/types";
import { entityWithApi, entityApiSettings, LoggedInCanViewButOnlyAdminUpdatesInsertsAndDeletes } from "../server/api-interfaces";
import { Context } from "../shared/context";
import { DataColumnSettings } from "radweb/utils/dataInterfaces1";


export class BasketType extends IdEntity<BasketId> implements entityWithApi {
  getDataApiSettings(): entityApiSettings {
    return LoggedInCanViewButOnlyAdminUpdatesInsertsAndDeletes;
  }
  name = new StringColumn({ caption: "שם" });
  constructor(context: Context) {
    super(new BasketId(context), BasketType, "BasketType");
    this.initColumns();
  }
}
export class BasketId extends Id implements HasAsyncGetTheValue {
  constructor(private context: Context,settingsOrCaption?: DataColumnSettings<string, StringColumn> | string) {
    super(settingsOrCaption);
  }
  get displayValue() {
    return this.context.for(BasketType).lookup(this).name.value;
  }
  async getTheValue() {
    let r = await this.context.for(BasketType).lookupAsync(this);
    if (r && r.name && r.name.value)
      return r.name.value;
    return '';
  }
}