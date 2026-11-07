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

    // Login endpoints are public and must NOT carry a (possibly stale) token,
    // otherwise an expired token could interfere with logging back in.
    const isAuthEndpoint = req.url.includes('/lala-pos/login');

    const token = sessionStorage.getItem(sessionStorage_token_key);
    const authReq = (token && !isAuthEndpoint)
      ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : req;

    return next.handle(authReq).pipe(timeout(60000), catchError((error: HttpErrorResponse) => {

      // Session expired / not authenticated on a protected call: clear the
      // session and bounce to login. Never do this for the login call itself
      // (a failed login is handled by the login component), and avoid a loop.
      if (error.status === 401 && !isAuthEndpoint) {
        sessionStorage.clear();
        if (!location.pathname.endsWith('/login')) {
          location.href = 'login';
        }
        return throwError(error);
      }

      // Only surface non-auth errors, and read the message defensively.
      const path = (error.error && error.error.path) ? error.error.path : req.url;
      const message = (error.error && error.error.error) ? error.error.error : error.message;
      alert(path + ' : ' + message);
      return throwError(error);
    }));
  }

}
