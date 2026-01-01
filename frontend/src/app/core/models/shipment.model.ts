export interface Shipment {
  id: number;
  origin: string;
  destination: string;
  status: ShipmentStatus;
  createdAt: string;
  updatedAt: string;
  trackingNumber: string;
  estimatedDelivery?: string;
  description?: string;
}

export enum ShipmentStatus {
  CREATED = 'CREATED',
  PICKED_UP = 'PICKED_UP',
  IN_TRANSIT = 'IN_TRANSIT',
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
  DELIVERED = 'DELIVERED',
  DELAYED = 'DELAYED',
  RETURNED = 'RETURNED',
  CANCELLED = 'CANCELLED'
}

export interface ShipmentCreateRequest {
  origin: string;
  destination: string;
  description?: string;
  estimatedDelivery?: string;
}

export interface ShipmentUpdateRequest {
  status: ShipmentStatus;
}

export const SHIPMENT_STATUS_LABELS: Record<ShipmentStatus, string> = {
  [ShipmentStatus.CREATED]: 'Order created',
  [ShipmentStatus.PICKED_UP]: 'Picked up from origin',
  [ShipmentStatus.IN_TRANSIT]: 'In transit',
  [ShipmentStatus.OUT_FOR_DELIVERY]: 'Out for delivery',
  [ShipmentStatus.DELIVERED]: 'Delivered',
  [ShipmentStatus.DELAYED]: 'Delayed',
  [ShipmentStatus.RETURNED]: 'Returned to sender',
  [ShipmentStatus.CANCELLED]: 'Cancelled'
};

export const SHIPMENT_STATUS_BADGES: Record<ShipmentStatus, string> = {
  [ShipmentStatus.CREATED]: 'badge-secondary',
  [ShipmentStatus.PICKED_UP]: 'badge-primary',
  [ShipmentStatus.IN_TRANSIT]: 'badge-primary',
  [ShipmentStatus.OUT_FOR_DELIVERY]: 'badge-warning',
  [ShipmentStatus.DELIVERED]: 'badge-success',
  [ShipmentStatus.DELAYED]: 'badge-warning',
  [ShipmentStatus.RETURNED]: 'badge-secondary',
  [ShipmentStatus.CANCELLED]: 'badge-danger'
};
