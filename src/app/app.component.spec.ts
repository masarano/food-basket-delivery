import { TestBed, async } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AppComponent } from './app.component';
import { Products, WeeklyFamilyDeliveryProducts } from './weekly-families-deliveries/weekly-families-deliveries';
import { ServerContext } from './shared/context';
import { SqlBuilder, QueryBuilder } from './model-shared/types';
import { WebDriverProxy } from 'blocking-proxy/built/lib/webdriver_proxy';
import { parseAddress } from './families/families';

describe('AppComponent', () => {
  var context = new ServerContext();
  var p = new Products(context);
  var pd = new WeeklyFamilyDeliveryProducts(context);
  var sql = new SqlBuilder();
  sql.addEntity(p, 'p');
  var q = (query: QueryBuilder, expectresult: String) => {
    expect(sql.query(query)).toBe(expectresult);
  };
  it('basics work', () => {
    expect(sql.build(p.id)).toBe('p.id');
  });
  it('select start', () => {
    q({
      select: () => [p.id],
      from: p,
      orderBy: [p.id]
    }, 'select p.id from products p order by p.id');
  });
  it('Where', () => {
    q({
      select: () => [p.id],
      from: p,
      where: () => [sql.eq(p.order, 5)]
    }, 'select p.id from products p where p.ord2 = 5');
  });
  it('Where 2', () => {
    q({
      select: () => [p.id],
      from: p,
      where: () => [sql.eq(p.order, 5), sql.eq(p.order, 6)]
    }, 'select p.id from products p where p.ord2 = 5 and p.ord2 = 6');
  });
  it('Join', () => {
    q({
      select: () => [p.id],
      from: p,
      innerJoin: () => [{ to: pd, on: () => [sql.eq(pd.product, p.id)] }]
    }, 'select p.id from products p left join WeeklyFamilyDeliveryProducts e1 on e1.product = p.id');

  });
  it('select multiple Order By', () => {
    q({
      select: () => [p.id],
      from: p,
      orderBy: [p.id, { column: p.name, descending: true }]
    }, 'select p.id from products p order by p.id, p.name desc');
  });
  it("column dbname can reference root entity", () => {
    let sql = new SqlBuilder();
    expect(sql.columnSumInnerSelect(p, pd.Quantity, {
      from: pd,
      where: () => [sql.eq(pd.product, p.id)]

    })).toBe('(select sum(e1.Quantity) from WeeklyFamilyDeliveryProducts e1 where e1.product = products.id)');
  });
  it("case ", () => {
    expect(sql.case([
      { when: ['1=1', '2=2'], then: '3' },
      { when: ['3=3'], then: '4' }
    ], 9)).toBe("case when 1=1 and 2=2 then 3 when 3=3 then 4 else 9 end");
  });
  it('delete 2', () => {
    let p = new Products(context);
    expect(sql.delete(p, sql.eq(p.order, 5), sql.eq(p.order, 6))).toBe('delete from products where ord2 = 5 and ord2 = 6');
  });
  it('update ', () => {
    expect(sql.update(p, {
      set: () => [[p.id, "'123'"], [p.name, "'noam'"]],
      where: () => [sql.eq(p.order, 5), sql.eq(p.order, 6)]
    })).toBe("update products p set id = '123', name = 'noam' where p.ord2 = 5 and p.ord2 = 6");
  });
  it('update 2 ', () => {
    let pd = new WeeklyFamilyDeliveryProducts(context);
    expect(sql.update(p, {
      set: () => [[p.id, pd.product], [p.name, "'noam'"]],
      from: pd,
      where: () => [sql.eq(p.order, 5), sql.eq(p.order, pd.requestQuanity)]
    })).toBe("update products p set id = e2.product, name = 'noam' from WeeklyFamilyDeliveryProducts e2 where p.ord2 = 5 and p.ord2 = e2.requestQuanity");
  });
  it('insert ', () => {
    sql = new SqlBuilder();

    expect(sql.insert({
      into: p,
      set: () => [[p.id, pd.product], [p.name, "'noam'"]],
      from: pd,
      where: () => [sql.eq(pd.requestQuanity, 5)]
    })).toBe("insert into products (id, name) select e1.product, 'noam' from WeeklyFamilyDeliveryProducts e1 where e1.requestQuanity = 5");
  });
  it('filter ', () => {
    expect(sql.build(p.order.isEqualTo(3).and(p.order.isEqualTo(5)))).toBe('ord2 = 3 and ord2 = 5');
  });
  it('parse address', () => {
    let r = parseAddress("שנהב 4 דירה 76 קומה 19 כניסה א'");
    expect(r.address).toBe('שנהב 4');
    expect(r.dira).toBe('76');
    expect(r.floor).toBe('19');
    expect(r.knisa).toBe("א'"); 
  });
});


