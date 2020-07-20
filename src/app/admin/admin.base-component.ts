import {ChangeDetectorRef, HostListener, Directive, Injector, ViewChild} from '@angular/core';
import {
  BrandService,
  CatalogService,
  PostService,
  ProductOilService,
  CategoryService,
  SubCategoryService
} from '../_services';
import {MatTableDataSource, MatSort, MatPaginator, MatTable, MatDialog} from '@angular/material';
import {NewsInterface} from './news/news.interface';
import {SelectionModel} from '@angular/cdk/collections';
import {CdkDragDrop, moveItemInArray} from '@angular/cdk/drag-drop';
import clonedeep from 'lodash.clonedeep';
import {ActivatedRoute, Router} from '@angular/router';
import {Location} from '@angular/common';
import {UploadHelper} from '../_helpers';
import {ProductDrillService} from '../_services/product-drill.service';

@Directive()
// tslint:disable-next-line:directive-class-suffix
export abstract class AdminBaseComponent {
  public dataSource;
  public bulkAction;
  public selection = new SelectionModel(true, []);
  public postService: PostService;
  public brandService: BrandService;
  public catalogService: CatalogService;
  public categoryService: CategoryService;
  public productOilService: ProductOilService;
  public productDrillService: ProductDrillService;
  public dialog: MatDialog;
  public changeDetectorRefs: ChangeDetectorRef;
  public subcategoryService: any;
  public uploadHelper: UploadHelper;
  public router: Router;
  public route: ActivatedRoute;
  public location: Location;

  protected constructor(private injectorObj: Injector) {
    this.postService = this.injectorObj.get(PostService);
    this.brandService = this.injectorObj.get(BrandService);
    this.catalogService = this.injectorObj.get(CatalogService);
    this.categoryService = this.injectorObj.get(CategoryService);
    this.subcategoryService = this.injectorObj.get(SubCategoryService);
    this.productOilService = this.injectorObj.get(ProductOilService);
    this.productDrillService = this.injectorObj.get(ProductDrillService);
    this.uploadHelper = this.injectorObj.get(UploadHelper);
    this.changeDetectorRefs = this.injectorObj.get(ChangeDetectorRef);
    this.dialog = this.injectorObj.get(MatDialog);
    this.router = this.injectorObj.get(Router);
    this.route = this.injectorObj.get(ActivatedRoute);
    this.location = this.injectorObj.get(Location);
  }

  @ViewChild(MatSort, {static: true}) sort: MatSort;
  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;

  abstract refreshTable(id?);

  refreshTableRoutine() {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
    this.bulkAction = null;
    this.selection.clear();
    this.changeDetectorRefs.detectChanges();
  }

  drop(event: CdkDragDrop<string[]>, service, id?) {
    moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    this.dataSource.data = clonedeep(this.dataSource.data);
    if (id) {
      this.dataSource.data.push(id.id);
    }
    this.updatePosition(this.dataSource.data, service, id);
  }

  onBulkActionChange($event, service, id?) {
    const selectedRows = this.selection.selected;
    if (id) {
      selectedRows.push(id.id);
    }
    switch ($event.value) {
      case 'activate':
        service.bulkActivate(selectedRows).subscribe(res => {
          this.refreshTable(id);
        });
        break;
      case 'deactivate':
        service.bulkDeactivate(selectedRows).subscribe(res => {
          this.refreshTable(id);
        });
        break;
      case 'delete':
        service.bulkDelete(selectedRows).subscribe(res => {
          this.refreshTable(id);
        });
        break;
    }
  }

  openDialog(action, obj, service, dialogComponent, id?) {
    obj = obj || {};
    obj.action = action;
    const dialogRef = this.dialog.open(dialogComponent, {
      width: '800px',
      data: obj,
      panelClass: 'formFieldWidth752'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (id) {
        result.data.id = id.id;
      }

      if (result.event === 'Create') {
        this.create(result.data, service, id);
      } else if (result.event === 'Update') {
        this.update(result.data, service, id);
      } else if (result.event === 'Delete') {
        this.delete(result.data, service, id);
      }
    });
  }

  create(rowObj, service, id?) {
    service.create(rowObj).subscribe(res => {
      this.refreshTable(id);
    });
  }

  update(dataSource, service, id?) {
    service.update(dataSource).subscribe(res => {
      this.refreshTable(id);
    });
  }

  delete(dataSource, service, id?) {
    service.delete(dataSource).subscribe(res => {
      this.refreshTable(id);
    });
  }

  updatePosition(dataSource, service, id?) {
    service.updatePosition(dataSource).subscribe(res => {
      this.refreshTable(id);
    });
  }

  applyFilter(filterValue: string) {
    this.dataSource.filter = filterValue.trim().toLocaleLowerCase();
  }

  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = (this.dataSource !== undefined) ? this.dataSource.data.length : 0;
    return numSelected === numRows;
  }

  masterToggle() {
    this.isAllSelected() ?
      this.selection.clear() :
      this.dataSource.data.forEach(row => this.selection.select(row));
  }

  checkboxLabel(row?: NewsInterface): string {
    if (!row) {
      return `${this.isAllSelected() ? 'select' : 'deselect'} all`;
    }
    return `${this.selection.isSelected(row) ? 'deselect' : 'select'} row ${row.position + 1}`;
  }
}