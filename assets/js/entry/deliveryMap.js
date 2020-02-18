import "../../styles/importer.scss";
import { DeliveryMapView, PickupOption } from "../model";
let deliveryMapView = new DeliveryMapView({ el: $('#deliveryMapContainer'), model: new PickupOption()});
