import { Component } from '@angular/core';
import { Router, ActivatedRoute, NavigationEnd, ActivatedRouteSnapshot, UrlSegment } from '@angular/router';

@Component({
  selector: 'app-breadcrumb',
  templateUrl: './breadcrumb.component.html',
  styleUrls: ['./breadcrumb.component.css']
})
export class BreadcrumbComponent {


  public test = {
    name: 'name',
    url: ['url', 'url2'],
    param: undefined,
    params: 'parms',
  };
  public pageTitle: string = '';
  public breadcrumbs: {
    name: string;
    url: any;
    param: any;
  }[] = [];

  constructor(public router: Router, public activatedRoute: ActivatedRoute) {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.breadcrumbs = [];
        this.parseRoute(this.router.routerState.snapshot.root);
        // console.log(this.router.routerState.snapshot.root);
      }
    });
  }
  i: number = 0;
  parseRoute(node: ActivatedRouteSnapshot) {
    if (node.data['breadcrumb']) {
      if (node.url.length) {
        let urlSegments: UrlSegment[] = [];
        node.pathFromRoot.forEach((routerState) => {
          urlSegments = urlSegments.concat(routerState.url);
        });

        const url = urlSegments
          .map((urlSegment) => {
            return urlSegment.path;
          })
          .join('/');

        let path: any[] = node.url.filter((f) => f.path == node.params['id']);

        this.i++;
        this.breadcrumbs.push({
          name:
            path.length > 0
              ? node.data['breadcrumb'] + ' ' + node.params['id']
              : node.data['breadcrumb'],
          url: url,
          param: node.queryParams,
        });
      }
    }

    if (node.firstChild) {
      this.parseRoute(node.firstChild);
    }
  }
  public redirect(idx: number) {
    // console.log(this.breadcrumbs[idx]);

    this.router.navigate(
      [
        'berita_acara',
        { data: 'Berit Acara Cabang' },
        'berita_acara_cabang',
        { data: 'Berita Acara Cabang A001V' },
      ],

      {
        queryParams: this.breadcrumbs[idx].param,
      }
    );
  }
}
export type urlparam = {};


