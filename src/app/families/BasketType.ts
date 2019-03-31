
import { IdEntity } from "../model-shared/types";
import { StringColumn } from "radweb";
import { evilStatics } from "../auth/evil-statics";
import { Id, HasAsyncGetTheValue } from "../model-shared/types";
import { Context, EntityClass } from "../shared/context";
import { DataColumnSettings } from "radweb";

@EntityClass
export class BasketType extends IdEntity<BasketId>  {

  name = new StringColumn({ caption: "שם" });
  constructor(context: Context) {
    super(new BasketId(context), {
      name: "BasketType",
      allowApiRead: context.isLoggedIn(),
      allowApiCRUD: context.isAdmin()
    });
  }
}
export class BasketId extends Id implements HasAsyncGetTheValue {
  constructor(private context: Context, settingsOrCaption?: DataColumnSettings<string, StringColumn> | string) {
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
  getColumn()
  {
    return {
      column: this,
      dropDown: {
        source: this.context.for(BasketType).create(),
        orderBy: (f: BasketType) => {
          return [{ column: f.name }];
        },
        width: '100'
      },
    };
  }
}