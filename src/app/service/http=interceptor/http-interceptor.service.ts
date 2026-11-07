import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';
import { sessionStorage_token_key } from 'src/app/model/general';

@Injectable({
  providedIn: 'root'
})
export class HttpInterceptorService implements HttpInterceptor {

  constructor() { }
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

    // Attach the bearer token (set at login) to every outgoing request.
    const token = sessionStorage.getItem(sessionStorage_token_key);
    const authReq = token
      ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : req;

    return next.handle(authReq).pipe(timeout(60000), catchError((error: HttpErrorResponse) => {

      // Session expired or not authenticated: clear it and send the user to login.
      if (error.status === 401) {
        sessionStorage.clear();
        if (location.pathname !== '/login') {
          location.href = '/login';
        }
        return throwError(error);
      }

      alert((error.error?.path ?? req.url) + ' : ' + (error.error?.error ?? error.message));
      return throwError(error);
    }))
  }

}
