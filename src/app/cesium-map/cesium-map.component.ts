import { Component, OnInit, OnDestroy, ElementRef, Version, } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Credit, ImageryLayer, InfoBox, NavigationHelpButton, NavigationHelpButtonViewModel, Request } from 'cesium';

declare var Cesium: any; 


@Component({
  selector: 'app-cesium-map',
  imports: [CommonModule],
  templateUrl: './cesium-map.component.html',
  styleUrls: ['./cesium-map.component.css']
})
export class CesiumMapComponent implements OnInit, OnDestroy {
  private viewer: any;
  constructor() {}
  
  ngOnInit(): void {
    const viewer= new Cesium.CesiumWidget("cesiumContainer"); 
    window.viewer = viewer;
    const imageryLayers = viewer.imageryLayers;

  const viewModel = {
    layer:null,
    index:null,
    layers: [] as any,
    baseLayers: [] as any[],
    upLayer: null,
    downLayer: null,
    selectedLayer: null,
    isSelectableLayer: function (layer: any) {
      return this.baseLayers.indexOf(layer) >= 0;
    },
    raise: function (layer: null, index: number) {
      imageryLayers.raise(layer);
      viewModel.upLayer = layer;
      viewModel.downLayer = viewModel.layers[Math.max(0, index - 1)];
      updateLayerList();
      window.setTimeout(function () {
        viewModel.upLayer = viewModel.downLayer = null;
      }, 10);
    },
    lower: function (layer: null, index: number) {
      imageryLayers.lower(layer);
      viewModel.upLayer =
        viewModel.layers[Math.min(viewModel.layers.length - 1, index + 1)];
      viewModel.downLayer = layer;
      updateLayerList();
      window.setTimeout(function () {
        viewModel.upLayer = viewModel.downLayer = null;
      }, 10);
    },
    canRaise: function (layerIndex: number) {
      return layerIndex > 0;
    },
    canLower: function (layerIndex: number) {
      return layerIndex >= 0 && layerIndex < imageryLayers.length - 1;
    },
  };
  const baseLayers = viewModel.baseLayers;

  Cesium.knockout.track(viewModel);

  async function addBaseLayerOption(name: any, imageryProviderPromise: any) {
    try {
      const imageryProvider = await Promise.resolve(imageryProviderPromise);

      const layer = new Cesium.ImageryLayer(imageryProvider);
      layer.name = name;
      baseLayers.push(layer);
      updateLayerList();
    } catch (error) {
      console.error(`There was an error while creating ${name}. ${error}`);
    }
  }

  async function addAdditionalLayerOption(
    name: any,
    imageryProviderPromise: any,
    alpha: any,
    show: any) 
    {
      try {
        const imageryProvider = await Promise.resolve(imageryProviderPromise);
        const layer = new Cesium.ImageryLayer(imageryProvider);
        layer.alpha = Cesium.defaultValue(alpha, 0.5);
        layer.show = Cesium.defaultValue(show, true);
        layer.name = name;
        imageryLayers.add(layer);
        Cesium.knockout.track(layer, ["alpha", "show", "name"]);
        updateLayerList();
      } catch (error) {
        console.error(`There was an error while creating ${name}. ${error}`);
      }
    }

  function updateLayerList() {
    const numLayers = imageryLayers.length;
    viewModel.layers.splice(0, viewModel.layers.length);
    for (let i = numLayers - 1; i >= 0; --i) {
      viewModel.layers.push(imageryLayers.get(i));
    }
  }

  function setupLayers() {
    addBaseLayerOption("Bing Maps Aerial", Cesium.createWorldImageryAsync());
    addBaseLayerOption(
      "Bing Maps Road",
      Cesium.createWorldImageryAsync({
        style: Cesium.IonWorldImageryStyle.ROAD,
      }),
    );
    addBaseLayerOption(
      "ArcGIS World Street Maps",
      Cesium.ArcGisMapServerImageryProvider.fromUrl(
        "https://services.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer",
      ),
    );
    addBaseLayerOption("OpenStreetMaps", new Cesium.OpenStreetMapImageryProvider());
    addBaseLayerOption(
      "Stamen Maps",
      new Cesium.OpenStreetMapImageryProvider({
        url: "https://stamen-tiles.a.ssl.fastly.net/watercolor/",
        fileExtension: "jpg",
        credit:
          "Map tiles by Stamen Design, under CC BY 3.0. Data by OpenStreetMap, under CC BY SA.",
      }),
    );
    addBaseLayerOption(
      "Natural Earth II (local)",
      Cesium.TileMapServiceImageryProvider.fromUrl(
        Cesium.buildModuleUrl("Assets/Textures/NaturalEarthII"),
      ),
    );
    

    // Create the additional layers
    
    addAdditionalLayerOption(
      "LDAS MSTA Radar",
      new Cesium.WebMapServiceImageryProvider({
        url: "https://ldasdev.rj.my/gsdev/msta/wms",
        layers: "msta:HRIT_B13",
        // version: "1.3.0",
        credit: "LDAS MSTA",
        parameters: {
          // request: "GetMap",
          tiled: true,
          style: "msta:B13_Enhanced_2",
          transparent: "true",
          format: "image/png",
        },
      }),0.7,
      true
    );
    
    
  }

  setupLayers();
  const toolbar = document.getElementById("layeroption");
  
  Cesium.knockout.applyBindings(viewModel, toolbar);
  Cesium.knockout
    .getObservable(viewModel, "selectedLayer")
    .subscribe(function (baseLayer: { show: any; alpha: any; }) {
      // Handle changes to the drop-down base layer selector.
      let activeLayerIndex = 0;
      const numLayers = viewModel.layers.length;
      for (let i = 0; i < numLayers; ++i) {
        if (viewModel.isSelectableLayer(viewModel.layers[i])) {
          activeLayerIndex = i;
          break;
        }
      }
      const activeLayer = viewModel.layers[activeLayerIndex] as any;
      const show = activeLayer.show;
      const alpha = activeLayer.alpha;
      imageryLayers.remove(activeLayer, false);
      imageryLayers.add(baseLayer, numLayers - activeLayerIndex - 1);
      baseLayer.show = show;
      baseLayer.alpha = alpha;
      updateLayerList();
    });
  }
   
  ngOnDestroy(): void {

    if (this.viewer) {
      this.viewer.destroy();
    }
  }

}


