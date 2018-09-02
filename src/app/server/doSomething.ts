import { HelpersAndStats } from "../delivery-follow-up/HelpersAndStats";
import { readFileSync, readFile } from "fs";
import { ColumnHashSet, DateColumn } from "radweb";

import { GetGeoInformation } from "../shared/googleApiHelpers";
import { foreachEntityItem, foreachSync } from "../shared/utils";

import { serverInit } from "./serverInit";
import * as XLSX from 'xlsx';
import { AddBoxAction } from "../asign-family/add-box-action";
import { Families } from "../families/families";
import { FamilySources } from "../families/FamilySources";

serverInit();

export async function DoIt() {
    //try {
//
//        let f = new Families();
//        let r = await f.source.find({ where: f.iDinExcel.isEqualTo("X") });
//        r.forEach(ff => { 
 //           console.log(ff.address.value);
 //           let g = ff.getGeocodeInformation();
  //          let s = g.ok();
  //      });
  //  }
  //  catch (err) {
  //      console.log(err);
  //  }
  await ImportFromExcel() ;
}
DoIt();


async function getGeolocationInfo() {
    let families = new Families();
    foreachEntityItem(new Families(), undefined, async f => {
        if (!f.getGeocodeInformation().ok()) {
            f.addressApiResult.value = (await GetGeoInformation(f.address.value)).saveToString();
            await f.save();
        }

    });
}
async function ImportFromExcel() {

    let wb = XLSX.readFile("C:\\temp\\Food-basket-delivery.xlsx");
    let s = wb.Sheets[wb.SheetNames[0]];
    let o = XLSX.utils.sheet_to_json(s);
    let found = true;
    await foreachSync(o, async r => {
        try {

            let f = new Families();
            let get = x => {
                if (!r[x])
                    return '';
                return r[x];
            };
            f.appartment.value = r["דירה"];
            f.address.value = (get("כתובת") + ' ' + get("מספר").trim() + ' ' + get("עיר"));
            f.familyMembers.value = +r["מס' נפשות"];
            f.name.value = get("שם").trim();
            if (!f.name.value) {
                f.name.value = '!ללא שם ';
            }
            f.phone1.value = r["טלפון"];
            f.phone2.value = r["טלפון2"];
            f.idInExcel.value = r["מספר סידורי"];
            
            if (r["מס' נפשות"] == 2)
                f.basketType.value= "fc77209c-0fdb-4bf0-bc27-52ea5fe4f4c2"
            if (r["מס' נפשות"] == 3)
                f.basketType.value= "d4aa7ffc-6537-4644-8ddd-0adfe7c4a51e"
            if (r["מס' נפשות"] > 3 && r["מס' נפשות"] <= 6)
                f.basketType.value= "6b707360-94bf-491f-a14b-cef5d2d9941d"
            if (r["מס' נפשות"] > 6)
                f.basketType.value= "80595d5c-9d0c-44c2-b751-775862a6751e"  


            f.addressComment.value = r["הערות"];
    
            let nameFromExcel = r["מקור"];
    
            if (nameFromExcel.value == "empty")
            {}
            else
            {
                let source = new FamilySources();
                let rr = await source.source.find({ where: source.name.isEqualTo(nameFromExcel) });
                if (rr.length > 0)
                { 
                    f.familySource.value = rr[0].id.value;
                }
                else {
                    source.name.value = nameFromExcel;
                    await source.save();
                    f.familySource.value = source.id.value;
                    }
            }
                          
                if (found) {
                    await f.doSaveStuff({});
                    await f.save();
                }
            
            else if (f.address.value == 'טטט')
                found = true;
        }
        catch (err) {
            console.log(err, o);
        }

    });

}

async function updateAddress() {
    (await new Families().source.find({})).forEach(f => {
        if (f.address.value.indexOf('נתניה') < 0) {
            f.address.value = f.address.value.trim() + ' נתניה';
            f.save();
        }
    });
}

async function updatePhone() {
    (await new Families().source.find({})).forEach(f => {
        f.phone1.value = '0507330590';
        f.save();
    });
}
function UpdateAllFamiliyNames() {
    readFile(`c:\\temp\\famiilies.txt`, (err, data) => {
        let names = data.toString().split('\r\n');
        new Families().source.find({}).then(async families => {
            for (let i = 0; i < families.length; i++) {
                families[i].name.value = names[i];
                await families[i].save();
                console.log(i + families[i].name.value);
            }
        });

    });
}
async function imprortFamiliesFromJson() {
    let r = readFileSync(`c:\\temp\\hugmoms.json`);
    var rows = JSON.parse(r.toString());
    for (let i = 0; i < rows.length; i++) {
        let f = new Families();
        let c = new ColumnHashSet();
        f.__fromPojo(rows[i], c);
        let families = await f.source.find({ where: f.id.isEqualTo(f.id.value) });
        if (families.length == 0) {
            await f.save();
        }
    }
}