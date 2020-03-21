import "../../styles/importer.scss";
import { DeliveryLocationMapView, Meal } from "../model";
let deliveryLocationMapView = new DeliveryLocationMapView({ el: $('#locatorMapContainer'), model: new Meal()});
