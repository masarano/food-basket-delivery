import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes, RouteReuseStrategy, RouteConfigLoadStart } from '@angular/router';

import { HelpersComponent } from './helpers/helpers.component';
import { LoginComponent } from './users/login/login.component';
import { RegisterComponent } from './users/register/register.component';
import { LoggedInGuard, HolidayDeliveryAdmin, NotLoggedInGuard } from './auth/auth-guard';
import { UpdateInfoComponent } from './users/update-info/update-info.component';
import { FamiliesComponent } from './families/families.component';
import { MyFamiliesComponent } from './my-families/my-families.component';
import { AsignFamilyComponent } from './asign-family/asign-family.component';
import { ManageComponent } from './manage/manage.component';
import { FixAddressComponent } from './fix-address/fix-address.component';
import { LoginFromSmsComponent } from './login-from-sms/login-from-sms.component';
import { DeliveryFollowUpComponent } from './delivery-follow-up/delivery-follow-up.component';
import { NewsComponent } from './news/news.component';
import { DeliveryEventsComponent } from './delivery-events/delivery-events.component';
import { StamTestComponent } from './stam-test/stam-test.component';
import { CustomReuseStrategy } from './custom-reuse-controller-router-strategy'
import { evilStatics } from './auth/evil-statics';
import { routingInfo, componentRoutingInfo } from './shared/routing-helper';
import { ProductsComponent } from './products/products.component';


import { MyWeeklyFamiliesComponent } from './my-weekly-families/my-weekly-families.component';
import { WeeklyPackerByFamilyComponent } from './weekly-packer-by-family/weekly-packer-by-family.component';
import { WeeklyPackerByProductComponent } from './weekly-packer-by-product/weekly-packer-by-product.component';
import { MyWeeklyFamilyDeliveriesComponent } from './my-weekly-family-deliveries/my-weekly-family-deliveries.component';
import { AddressProblemComponent } from './address-problem/address-problem.component';
import { StressTestComponent } from './stress-test/stress-test.component';



const routes: Routes = [
  AsignFamilyComponent.route,
  FamiliesComponent.route,
  NewsComponent.route,
  DeliveryFollowUpComponent.route,
  FixAddressComponent.route,
  AddressProblemComponent.route,
  HelpersComponent.route,
  DeliveryEventsComponent.route,
  ManageComponent.route,
  
  MyWeeklyFamiliesComponent.route,
  MyWeeklyFamilyDeliveriesComponent.route,
  WeeklyPackerByFamilyComponent.route,
  WeeklyPackerByProductComponent.route,
  ProductsComponent.route,
  LoginFromSmsComponent.route,

  //{ path: 'stam-test', component: StressTestComponent },
  MyFamiliesComponent.route,
  UpdateInfoComponent.route,
  LoginComponent.route,
  RegisterComponent.route,
  
  //{ path: 'stam', component: StamTestComponent },
  { path: '', redirectTo: '/assign-families', pathMatch: 'full' },
  { path: '**', redirectTo: '/assign-families', pathMatch: 'full' }
];

evilStatics.routes.assignFamilies = '/' + AsignFamilyComponent.route.path;
evilStatics.routes.login = '/' + LoginComponent.route.path;
evilStatics.routes.myFamilies = '/' + MyFamiliesComponent.route.path;
evilStatics.routes.register = '/' + RegisterComponent.route.path;
evilStatics.routes.updateInfo = '/' + UpdateInfoComponent.route.path;
evilStatics.routes.myWeeklyFamilies = '/' + MyWeeklyFamiliesComponent.route.path;
evilStatics.routes.weeklyFamiliesPack = '/' + WeeklyPackerByFamilyComponent.route.path;
@NgModule({
  imports: [
    CommonModule, RouterModule.forRoot(routes
      //    ,{enableTracing:true}
    )
  ],
  declarations: [],
  exports: [RouterModule],
  providers: [{ provide: RouteReuseStrategy, useClass: CustomReuseStrategy }]
})
export class AppRoutingModule { } 
