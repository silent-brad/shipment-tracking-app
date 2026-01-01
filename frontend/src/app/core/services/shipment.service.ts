import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';

import { 
  Shipment, 
  ShipmentCreateRequest, 
  ShipmentUpdateRequest, 
  ShipmentStatus 
} from '../models/shipment.model';
import { environment } from '../../../environments/environment';

export interface PagedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

@Injectable({
  providedIn: 'root'
})
export class ShipmentService {
  private readonly API_URL = `${environment.apiUrl}/shipments`;
  
  private shipmentsSubject = new BehaviorSubject<Shipment[]>([]);
  public shipments$ = this.shipmentsSubject.asObservable();

  constructor(private http: HttpClient) {}

  createShipment(request: ShipmentCreateRequest): Observable<Shipment> {
    return this.http.post<Shipment>(this.API_URL, request)
      .pipe(
        tap(shipment => {
          const currentShipments = this.shipmentsSubject.value;
          this.shipmentsSubject.next([shipment, ...currentShipments]);
        })
      );
  }

  getAllShipments(page: number = 0, size: number = 10): Observable<PagedResponse<Shipment>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', 'updatedAt,desc');

    return this.http.get<PagedResponse<Shipment>>(this.API_URL, { params })
      .pipe(
        tap(response => this.shipmentsSubject.next(response.content))
      );
  }

  getShipmentById(id: number): Observable<Shipment> {
    return this.http.get<Shipment>(`${this.API_URL}/${id}`);
  }

  trackShipment(trackingNumber: string): Observable<Shipment> {
    return this.http.get<Shipment>(`${this.API_URL}/track/${trackingNumber}`);
  }

  updateShipmentStatus(id: number, request: ShipmentUpdateRequest): Observable<Shipment> {
    return this.http.put<Shipment>(`${this.API_URL}/${id}/status`, request)
      .pipe(
        tap(updatedShipment => {
          const currentShipments = this.shipmentsSubject.value;
          const index = currentShipments.findIndex(s => s.id === id);
          if (index !== -1) {
            const updatedShipments = [...currentShipments];
            updatedShipments[index] = updatedShipment;
            this.shipmentsSubject.next(updatedShipments);
          }
        })
      );
  }

  deleteShipment(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`)
      .pipe(
        tap(() => {
          const currentShipments = this.shipmentsSubject.value;
          const filteredShipments = currentShipments.filter(s => s.id !== id);
          this.shipmentsSubject.next(filteredShipments);
        })
      );
  }

  getShipmentsByStatus(status: ShipmentStatus): Observable<Shipment[]> {
    return this.http.get<Shipment[]>(`${this.API_URL}/status/${status}`);
  }

  getOverdueShipments(): Observable<Shipment[]> {
    return this.http.get<Shipment[]>(`${this.API_URL}/overdue`);
  }

  refreshShipments(): void {
    this.getAllShipments().subscribe();
  }
}
