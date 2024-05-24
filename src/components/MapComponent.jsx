import { React, useState, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
} from "react-leaflet";
import { blueIcon, redIcon } from "../assets/icons";
import { useReRender, useSelectedMarker, useTempMarker } from "./Context";
import instance from "../js/connection";
import * as L from "leaflet";
import { outerBounds } from "../js/utils";
import { MarkerStructure } from "../js/structures";
import { parse } from "postcss";

function MapComponent({}) {
  const { selectedMarker, setSelectedMarker } = useSelectedMarker();
  const { tempMarker, setTempMarker } = useTempMarker();
  const { reRender, setReRender } = useReRender();

  const [markers, setMarkers] = useState([]);

  const handleMarkerClick = (marker) => {
    setSelectedMarker(marker);
  };

  useEffect(() => {
    const fetchDataFromConnection = async () => {
      try {
        const response = await instance.get("/pin/getAllPins");
        setMarkers([]);
        response.data.map((item) => {
          const newMarker = new MarkerStructure(
            parseFloat(item.location.lat),
            parseFloat(item.location.lng),
            item.user_ip,
            item.title,
            item.text,
            item.photo_id,
            item.id
          );
          setMarkers((prevMarkers) => [...prevMarkers, newMarker.serialize()]);
        });
        return;
      } catch (error) {
        console.error("Error fetching pins:", error);
      }
    };

    fetchDataFromConnection();
  }, [reRender, tempMarker, selectedMarker]);

  // In this component it uses tempMarker to show the marker that is being created
  // But inside the app selected marker is used to show the marker that is being created
  // So when selectedMarker is null, it means that the marker is not being created
  // So it sets the tempMarker to null

  // TODO: Refactor this to use only one state for the marker that is being created
  useEffect(() => {
    if (selectedMarker === null) {
      setTempMarker(null);
    }
  }, [selectedMarker]);

  const ClickMarker = () => {
    const map = useMapEvents({
      click: (e) => {
        const newMarker = new MarkerStructure(
          e.latlng.lat,
          e.latlng.lng,
          "",
          "",
          "",
          "",
          Date.now()
        );
        setSelectedMarker(newMarker.serialize());
        setTempMarker(newMarker.serialize());
      },
    });
  };

  const corner1 = L.latLng(outerBounds[0][0], outerBounds[0][1]);
  const corner2 = L.latLng(outerBounds[1][0], outerBounds[1][1]);

  return (
    <MapContainer
      center={[38.89958342598271, 35.04638671875001]}
      maxBoundsViscosity={1.0}
      maxBounds={L.latLngBounds(corner1, corner2)}
      boundsOptions={{ padding: [50, 50] }}
      minZoom={6}
      zoom={7}
      maxZoom={16}
      className="h-screen w-screen z-0"
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.de/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />

      {markers.map((marker) => (
        <Marker
          key={marker.id}
          position={marker.location}
          icon={redIcon}
          eventHandlers={{ click: () => handleMarkerClick(marker) }}
        ></Marker>
      ))}
      {tempMarker === null ? null : (
        <Marker
          key={tempMarker.id}
          position={tempMarker.location}
          icon={blueIcon}
          eventHandlers={{ click: () => handleMarkerClick(tempMarker) }}
        ></Marker>
      )}

      <ClickMarker />
    </MapContainer>
  );
}

export default MapComponent;
