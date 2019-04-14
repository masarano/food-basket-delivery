/// <reference types="@types/googlemaps" />
import * as chart from 'chart.js';
import { Component, OnInit, ViewChild, Sanitizer, OnDestroy } from '@angular/core';
import { GridSettings } from 'radweb';
import { Families } from '../families/families';
import { DialogService } from '../select-popup/dialog';
import { GeocodeInformation, GetGeoInformation } from '../shared/googleApiHelpers';

import { DomSanitizer } from '@angular/platform-browser';
import { Route } from '@angular/router';
import { HolidayDeliveryAdmin } from '../auth/auth-guard';
import { Context, DirectSQL } from '../shared/context';
import { RunOnServer } from '../auth/server-action';
import { SqlBuilder } from '../model-shared/types';
import { DeliveryStatus } from '../families/DeliveryStatus';
import { SelectService } from '../select-popup/select-service';
import { SWITCH_INJECTOR_FACTORY__POST_R3__ } from '@angular/core/src/di/injector';
import { colors } from '../families/stats-action';
import { BusyService } from '../select-popup/busy-service';

@Component({
  selector: 'app-fix-address',
  templateUrl: './fix-address.component.html',
  styleUrls: ['./fix-address.component.scss']
})
export class FixAddressComponent implements OnInit, OnDestroy {
  constructor(private context: Context, private dialog: DialogService, private selectService: SelectService, busy: BusyService) {

    let y = dialog.refreshStatusStats.subscribe(() => {
      busy.donotWait(async () => {
        await this.refreshFamilies();
      });
    });
    this.onDestroy = () => {
      y.unsubscribe();
    };

  }
  ngOnDestroy(): void {
    this.onDestroy();
  }
  onDestroy = () => { };
  static route: Route = {
    path: 'addresses',
    component: FixAddressComponent,
    data: { name: 'מפת הפצה' }, canActivate: [HolidayDeliveryAdmin]
  };

  gridView = true;



  mapVisible = true;
  mapInit = false;
  bounds = new google.maps.LatLngBounds();
  dict = new Map<string, infoOnMap>();
  async test() {

    var mapProp: google.maps.MapOptions = {
      center: new google.maps.LatLng(32.3215, 34.8532),
      zoom: 13,
      mapTypeId: google.maps.MapTypeId.ROADMAP,

    };
    if (!this.mapInit) {

      this.map = new google.maps.Map(this.gmapElement.nativeElement, mapProp);
      this.mapInit = true;
      await this.refreshFamilies();
      this.map.fitBounds(this.bounds);
    }


    this.mapVisible = !this.mapVisible;



  }
  ready = new statusClass('טרם שויכו', 'https://maps.google.com/mapfiles/ms/micons/yellow-dot.png', colors.yellow);
  onTheWay = new statusClass('בדרך', 'https://maps.google.com/mapfiles/ms/micons/ltblue-dot.png', colors.blue);
  problem = new statusClass('בעיות', 'https://maps.google.com/mapfiles/ms/micons/red-pushpin.png', colors.red);
  success = new statusClass('הגיעו', 'https://maps.google.com/mapfiles/ms/micons/green-dot.png', colors.green);
  statuses = [this.ready, this.onTheWay, this.success, this.problem];
  selectedStatus: statusClass;
  async refreshFamilies() {
    let families = await FixAddressComponent.GetFamiliesLocations();
    this.statuses.forEach(element => {
      element.value = 0;
    });

    families.forEach(f => {

      let familyOnMap = this.dict.get(f.id);
      let isnew = false;
      if (!familyOnMap) {
        isnew = true;
        familyOnMap = {
          marker: new google.maps.Marker({ map: this.map, position: { lat: f.lat, lng: f.lng } })
          , prevStatus: undefined,
          prevCourier: undefined

        };
        this.dict.set(f.id, familyOnMap);
        let info: google.maps.InfoWindow;
        let family: Families;
        google.maps.event.addListener(familyOnMap.marker, 'click', async () => {
          if (!info) {
            info = new google.maps.InfoWindow({
              content: `<h4>${f.status}</h4>`
            });
            //info.open(this.map, familyOnMap.marker);
          }
          family = await this.context.for(Families).findFirst(fam => fam.id.isEqualTo(f.id));
          this.selectService.updateFamiliy({ f: family });
        });
      }

      let status: statusClass;
      switch (f.status) {
        case DeliveryStatus.ReadyForDelivery.id:
          if (f.courier)
            status = this.onTheWay;
          else
            status = this.ready;
          break;
        case DeliveryStatus.Success.id:
        case DeliveryStatus.SuccessLeftThere.id:
          status = this.success;
          break;
        case DeliveryStatus.FailedBadAddress.id:
        case DeliveryStatus.FailedNotHome.id:
        case DeliveryStatus.FailedOther.id:
          status = this.problem;
          break;
      }
      if (status)
        status.value++;

      if (status != familyOnMap.prevStatus || f.courier != familyOnMap.prevCourier) {
        familyOnMap.marker.setIcon(status.icon);

        if (!isnew) {
          familyOnMap.marker.setAnimation(google.maps.Animation.DROP);
          setTimeout(() => {
            familyOnMap.marker.setAnimation(null);
          }, 1000);
        }
        familyOnMap.prevStatus = status;
        familyOnMap.prevCourier = f.courier;
      }
      familyOnMap.marker.setVisible(!this.selectedStatus || this.selectedStatus == status);

      this.bounds.extend(familyOnMap.marker.getPosition());

    });
    this.updateChart();
  }
  @RunOnServer({ allowed: c => c.isAdmin() })
  static async GetFamiliesLocations(context?: Context, directSql?: DirectSQL) {
    let f = new Families(context);
    let sql = new SqlBuilder();
    let r = (await directSql.execute(sql.query({
      select: () => [f.id, f.addressLatitude, f.addressLongitude, f.deliverStatus, f.courier],
      from: f,
      where: () => {
        let where = f.deliverStatus.IsDifferentFrom(DeliveryStatus.NotInEvent.id).and(f.deliverStatus.IsDifferentFrom(DeliveryStatus.Frozen.id));
        return [where];
      }
    })));

    return r.rows.map(x => {
      return {
        id: x[r.fields[0].name],
        lat: +x[r.fields[1].name],
        lng: +x[r.fields[2].name],
        status: +x[r.fields[3].name],
        courier: x[r.fields[4].name]
      } as familyQueryResult;

    }) as familyQueryResult[];
  }

  @ViewChild('gmap') gmapElement: any;
  map: google.maps.Map;
  async ngOnInit() {

    this.test();
  }
  options: chart.ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    legend: {
      position: 'right',
      onClick: (event: MouseEvent, legendItem: any) => {
        this.selectedStatus = this.statuses[legendItem.index];
        this.refreshFamilies();
        return false;
      }
    },
  };
  public chartClicked(e: any): void {
    if (e.active && e.active.length > 0) {
      this.selectedStatus = this.statuses[e.active[0]._index];
      this.refreshFamilies();
    }
  }
  updateChart() {
    this.pieChartData = [];
    this.pieChartLabels.splice(0);
    this.colors[0].backgroundColor.splice(0);


    this.statuses.forEach(s => {

      this.pieChartLabels.push(s.name + ' ' + s.value);
      this.pieChartData.push(s.value);
      this.colors[0].backgroundColor.push(s.color);

    });
  }

  public pieChartLabels: string[] = [];
  public pieChartData: number[] = [];

  public colors: Array<any> = [
    {
      backgroundColor: []

    }];

  public pieChartType: string = 'pie';


}
interface familyQueryResult {
  id: string;
  lat: number;
  lng: number;
  status: number;
  courier: string;
}
interface infoOnMap {
  marker: google.maps.Marker;
  prevStatus: statusClass;
  prevCourier: string;

}

class statusClass {
  constructor(public name: string, public icon: string, public color: string) {

  }
  value = 0;
}

