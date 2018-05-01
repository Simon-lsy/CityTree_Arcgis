/**
 * Created by lu on 2018/4/17.
 */

require([
        "esri/Map",
        "esri/views/MapView",
        "esri/views/SceneView",
        "esri/layers/FeatureLayer",
        "esri/tasks/QueryTask",
        "esri/tasks/support/Query",
        "esri/symbols/SimpleFillSymbol",

        "dojo/domReady!"
    ],
    function (Map, MapView, SceneView,
              FeatureLayer, QueryTask, Query, SimpleFillSymbol) {

        var map = new Map({
            basemap: "topo"
        });

        var view = new SceneView({
            container: "viewDiv",
            map: map,
            highlightOptions: {
                color: [255, 255, 0, 1],
                haloOpacity: 0.9,
                fillOpacity: 0.2
            },
            zoom: 8,  // Sets the zoom level based on level of detail (LOD)
            center: [121, 31]  // Sets the center point of view in lon/lat
        });

        var highlightSelect;

        /*************************************************************
         * The PopupTemplate content is the text that appears inside the
         * popup. {fieldName} can be used to reference the value of an
         * attribute of the selected feature. HTML elements can be used
         * to provide structure and styles within the content. The
         * fieldInfos property is an array of objects (each object representing
         * a field) that is use to format number fields and customize field
         * aliases in the popup and legend.
         **************************************************************/

        var template = {
            // ZIP is the name of a field in the service containing the zip code number of the feature
            title: "Buildup Area ID: {new_trend.csv.CITY_NAME}",
            highlightEnabled: true,
            content: [{
                type: "fields",
                fieldInfos: [{
                    fieldName: "new_trend.csv.2015常住人口",
                    visible: true,
                    label: "2015常住人口",
                    format: {
                        places: 0,
                        digitSeparator: true
                    }
                }, {
                    fieldName: "new_trend.csv.new_type",
                    visible: true,
                    label: "new_type",
                    format: {
                        places: 0,
                        digitSeparator: true
                    }
                }, {
                    fieldName: "new_trend.csv.type",
                    visible: true,
                    label: "type",
                    format: {
                        places: 0,
                        digitSeparator: true
                    }
                }, {
                    fieldName: "new_trend.csv.change_name",
                    visible: true,
                    label: "发展趋势"
                }, {
                    fieldName: "new_trend.csv.1991_to_2000",
                    visible: true,
                    label: "1991_to_2000"
                }, {
                    fieldName: "new_trend.csv.1996_to_2005",
                    visible: true,
                    label: "1996_to_2005"
                }, {
                    fieldName: "new_trend.csv.2001_to_2010",
                    visible: true,
                    label: "2001_to_2010"
                }, {
                    fieldName: "new_trend.csv.2006_to_2015",
                    visible: true,
                    label: "2006_to_2015"
                }]
            }]
        };

        /********************
         * Add feature layer
         ********************/

            // Carbon storage of trees in Warren Wilson College.
        var featureLayer = new FeatureLayer({
                url: "https://localhost:6443/arcgis/rest/services/MyMap/newTrend/MapServer/0",
                outFields: ["*"],
                popupTemplate: template
            });

        map.add(featureLayer);

        var graphics;

        view.whenLayerView(featureLayer).then(function (lyrView) {
            lyrView.watch("updating", function (val) {
                if (!val) { // wait for the layer view to finish updating

                    // query all the features available for drawing.
                    lyrView.queryFeatures().then(function (results) {

                        graphics = results;

                        // results.forEach(function (result, index) {
                        //
                        // });

                    });
                }
            });

            $('#centriod').on('click', function () {
                var citiesLayerUrl = "https://localhost:6443/arcgis/rest/services/MyMap/original_type/MapServer/0"; // Represents the REST endpoint for a layer of cities.
                var queryTask = new QueryTask({
                    url: citiesLayerUrl
                });
                var target_CityID = view.popup.features[0].attributes["new_trend.csv.new_type_CityID"];
                var query = new Query();
                query.returnGeometry = true;
                query.outFields = ["*"];
                query.where = "citytree2015.CityID = " + target_CityID.toString();
                queryTask.execute(query).then(function (results) {
                    console.log(results.features);
                    var resultId = results.features[0].attributes["citytree2015.FID"];
                    var target_result;
                    graphics.forEach(function (result, index) {
                        if (result.attributes["citytree2015.FID"] == resultId) {
                            target_result = result
                        }
                    });
                    view.popup.open({
                        features: [target_result],
                        location: target_result.geometry.centroid
                    })
                });

            });

            function sum(arr) {
                var s = 0;
                for (var i = arr.length - 1; i >= 0; i--) {
                    s += arr[i];
                }
                return s;
            }

            var development_type = ['爆发式增长', '中速增长', '爆发式增长->快速增长', '快速增长->中速增长->平稳增长', '平稳增长->低速增长', '快速增长->中速增长', '中速增长->平稳增长', '爆发式增长->快速增长->中速增长', '低速增长'];
            var city_type = [1, 3, 4, 7];
            var proportion_array = [];
            proportion_array.push([19.0, 0.0, 2.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]);
            proportion_array.push([25.0, 0.0, 47.0, 0.0, 0.0, 0.0, 0.0, 5.0, 0.0, 0.0, 0.0, 0.0]);
            proportion_array.push([1.0, 1.0, 11.0, 2.0, 0.0, 11.0, 2.0, 10.0, 0.0, 0.0, 0.0, 0.0]);
            proportion_array.push([1.0, 0.0, 0.0, 0.0, 2.0, 0.0, 3.0, 0.0, 1.0, 0.0, 0.0, 0.0]);


            $('.type_proportion').on('click', function () {
                var index = parseInt($(this).attr('city_type'));
                var proportion = proportion_array[index];
                var num = sum(proportion);
                var pieData = [];
                for (var i = 0; i < proportion.length; i++) {
                    if (proportion[i] != 0) {
                        pieData.push([development_type[i], proportion[i] / num]);
                    }
                }
                var citiesLayerUrl = "https://localhost:6443/arcgis/rest/services/MyMap/original_type/MapServer/1"; // Represents the REST endpoint for a layer of cities.
                var queryTask = new QueryTask({
                    url: citiesLayerUrl
                });
                var query = new Query();
                query.returnGeometry = true;
                query.outFields = ["*"];
                query.where = "type = " + city_type[index].toString();
                queryTask.execute(query).then(function (results) {
                    // var feature = results.features[0];

                    var CityID_list = [];
                    var query_where = '';
                    for (var i = 0; i < results.features.length - 1; i++) {
                        var target_CityID = results.features[i].attributes['CityID'];
                        CityID_list.push(target_CityID);
                        query_where += 'citytree2015.CityID = ' + target_CityID.toString() + ' or '
                    }
                    query_where += 'citytree2015.CityID = ' + results.features[results.features.length - 1].attributes['CityID'].toString();


                    var citiesLayerUrl = "https://localhost:6443/arcgis/rest/services/MyMap/original_type/MapServer/0"; // Represents the REST endpoint for a layer of cities.
                    var queryTask = new QueryTask({
                        url: citiesLayerUrl
                    });
                    var query = new Query();
                    query.returnGeometry = true;
                    query.outFields = ["*"];
                    query.where = query_where;
                    queryTask.execute(query).then(function (results) {
                        if (highlightSelect) {
                            highlightSelect.remove();
                        }
                        //highlight the feature
                        highlightSelect = lyrView.highlight(results.features);

                    });
                });

                $('#container').highcharts({
                    chart: {
                        backgroundColor: 'transparent',
                        plotBackgroundColor: null,
                        plotBorderWidth: null,
                        plotShadow: false
                    },
                    title: {
                        text: $(this).text() + '各发展阶段构成'
                    },
                    tooltip: {
                        headerFormat: '{series.name}<br>',
                        pointFormat: '{point.name}: <b>{point.percentage:.1f}%</b>'
                    },
                    plotOptions: {
                        pie: {
                            showInLegend: true,
                            allowPointSelect: true,
                            cursor: 'pointer',
                            dataLabels: {
                                enabled: false,
                                format: '<b>{point.name}</b>: {point.percentage:.1f} %',
                                style: {
                                    color: (Highcharts.theme && Highcharts.theme.contrastTextColor) || 'black'
                                }
                            },
                            events: {
                                click: function (e) {
                                    var trend_type = e.point.name;

                                    var citiesLayerUrl = "https://localhost:6443/arcgis/rest/services/MyMap/newTrend/MapServer/1"; // Represents the REST endpoint for a layer of cities.
                                    var queryTask = new QueryTask({
                                        url: citiesLayerUrl
                                    });
                                    var query = new Query();
                                    query.returnGeometry = true;
                                    query.outFields = ["*"];

                                    trend_type = trend_type.replace('快速增长', 'fast');
                                    trend_type = trend_type.replace('爆发式增长', 'boost');
                                    trend_type = trend_type.replace('中速增长', 'medium');
                                    trend_type = trend_type.replace('平稳增长', 'stable');
                                    trend_type = trend_type.replace('低速增长', 'stop');

                                    // if(trend_type.length<4){
                                    //     trend_type = parseInt(trend_type);
                                    // }


                                    // query.where ="Development_Trend = '"+ trend_type+"'";
                                    // query.where ="new_type_CityID = 3855";
                                    query.where = "target = '" + trend_type + "'" + " and type = " + city_type[index].toString();
                                    queryTask.execute(query).then(function (results) {
                                        // var feature = results.features[0];

                                        var CityID_list = [];
                                        var query_where = '';
                                        for (var i = 0; i < results.features.length - 1; i++) {
                                            var target_CityID = results.features[i].attributes['CityID'];
                                            CityID_list.push(target_CityID);
                                            query_where += 'citytree2015.CityID = ' + target_CityID.toString() + ' or '
                                        }
                                        query_where += 'citytree2015.CityID = ' + results.features[results.features.length - 1].attributes['CityID'].toString();


                                        var citiesLayerUrl = "https://localhost:6443/arcgis/rest/services/MyMap/original_type/MapServer/0"; // Represents the REST endpoint for a layer of cities.
                                        var queryTask = new QueryTask({
                                            url: citiesLayerUrl
                                        });
                                        var query = new Query();
                                        query.returnGeometry = true;
                                        query.outFields = ["*"];
                                        query.where = query_where;
                                        queryTask.execute(query).then(function (results) {
                                            if (highlightSelect) {
                                                highlightSelect.remove();
                                            }
                                            //highlight the feature
                                            highlightSelect = lyrView.highlight(results.features);

                                        });
                                    });


                                    // var citiesLayerUrl = "https://localhost:6443/arcgis/rest/services/MyMap/original_type/MapServer/0"; // Represents the REST endpoint for a layer of cities.
                                    // var queryTask = new QueryTask({
                                    //     url: citiesLayerUrl
                                    // });
                                    // var query = new Query();
                                    // query.returnGeometry = true;
                                    // query.outFields = ["*"];
                                    // query.where = "citytree2015.CityID = 3536" ;
                                    // queryTask.execute(query).then(function (results) {
                                    //     if (highlightSelect) {
                                    //         highlightSelect.remove();
                                    //     }
                                    //
                                    //     highlightSelect = lyrView.highlight(results.features);
                                    // });


                                }
                            }

                        }
                    },
                    series: [{
                        type: 'pie',
                        name: '阶段占比',
                        data: pieData
                    }]
                });

            });

        });

        var is_new_type = true;
        $('#change').on('click', function () {
            map.remove(featureLayer);
            is_new_type = !is_new_type;
            if (is_new_type) {
                var featureLayer = new FeatureLayer({
                    url: "https://localhost:6443/arcgis/rest/services/MyMap/new_type/MapServer/0",
                    outFields: ["*"],
                    popupTemplate: template
                });
            } else {
                var featureLayer = new FeatureLayer({
                    url: "https://localhost:6443/arcgis/rest/services/MyMap/original_type/MapServer/0",
                    outFields: ["*"],
                    popupTemplate: template
                });
            }

            map.add(featureLayer);
        });


        $('#show_centriod_BA').on('click', function () {
            $(this).text('Hide Centriod Buildup Area');
            var city_name = ['Yancheng', 'Changzhou', 'Suzhou', 'Jiaxing', 'Xianshan Qianqing Shaoxing'];
            var first_year = [6, 6, 2, 13, 111];
            var growth_year = [3.33, 25.83, 52.5, 0.0, 15.11];
            $('#container').highcharts({
                chart: {
                    backgroundColor: 'transparent',
                    type: 'column'
                },
                title: {
                    text: '聚类中心建成区增长'
                },
                xAxis: {
                    categories: city_name

                },
                yAxis: [{
                    min: 0,
                    title: {
                        text: 'First Area'
                    }
                }, {
                    title: {
                        text: 'Growth/Year'
                    },
                    opposite: true
                }],
                legend: {
                    shadow: false
                },
                tooltip: {
                    shared: true
                },
                plotOptions: {
                    column: {
                        grouping: false,
                        shadow: false,
                        borderWidth: 0
                    }
                },
                series: [{
                    name: 'First Area',
                    color: 'rgba(165,170,217,1)',
                    data: first_year,
                    pointPadding: 0.3,
                    pointPlacement: -0.2
                }, {
                    name: 'Growth/Year',
                    color: 'rgba(248,161,63,1)',
                    data: growth_year,
                    tooltip: {
                        // valuePrefix: '$',
                        valueSuffix: ' %'
                    },
                    pointPadding: 0.3,
                    pointPlacement: 0.2,
                    yAxis: 1
                }]
            });
        });

        $('#period').on('click', function () {

            var chart = Highcharts.chart('container', {
                chart: {
                    backgroundColor: 'transparent',
                    type: 'spline'
                },
                title: {
                    text: '五种类型进出口总额增长'
                },
                // subtitle: {
                //     text: '数据来源: WorldClimate.com'
                // },
                xAxis: {
                    categories: ['year1', 'year2', 'year3', 'year4', 'year5', 'year6',
                        'year7', 'year8', 'year9', 'year10']
                },
                yAxis: {
                    title: {
                        text: '进出口总额变化'
                    },
                    labels: {
                        formatter: function () {
                            return this.value;
                        }
                    }
                },
                tooltip: {
                    crosshairs: true,
                    shared: true
                },
                plotOptions: {
                    spline: {
                        marker: {
                            radius: 4,
                            lineColor: '#666666',
                            lineWidth: 1
                        }
                    }
                },
                series: [{
                    name: '低速增长',
                    marker: {
                        symbol: 'square'
                    },
                    data: [1.0, 1.1305607454074693, 1.269231171460369, 1.4160224894524582, 1.5709453180257427, 1.7340097433840473, 1.9052253707379516, 2.084601368608428, 2.2721465072552247, 2.467869192227002]
                }, {
                    name: '爆发式增长',
                    marker: {
                        symbol: 'diamond'
                    },
                    data: [1.0, 1.3525779224517855, 1.7857469164206152, 2.3095714979945523, 2.934487960510237, 3.6712900409087292, 4.531116077367028, 5.52543741756594, 6.666047887958283, 7.96505417230173]
                }, {
                    name: '快速增长',
                    marker: {
                        symbol: 'diamond'
                    },
                    data: [1.0, 1.3034931682868838, 1.6634071089742664, 2.0846693893011783, 2.5722251253311077, 3.131035780090868, 3.766078119257585, 4.482343295095174, 5.284836036210968, 6.178573925665472]
                }, {
                    name: '平稳增长',
                    marker: {
                        symbol: 'diamond'
                    },
                    data: [1.0, 1.2191428927866124, 1.462908555109904, 1.7318499851091125, 2.026490186928016, 2.3473257826282286, 2.694829980835635, 3.0694550492944175, 3.4716343982221742, 3.9017843537162995]
                }, {
                    name: '中速增长',
                    marker: {
                        symbol: 'diamond'
                    },
                    data: [1.0, 1.230913940201598, 1.497257920544793, 1.8020420589119004, 2.14834877451334, 2.539330578725371, 2.978208042006147, 3.4682679150227234, 4.012861385721968, 4.61540245695297]
                }]
            });

        });

        var clickNum_period = 0;

        $('#period_attr').on('click', function () {
            if (clickNum_period % 2 == 0) {
                $('#periodPic').css('visibility', 'visible');
            } else {
                $('#periodPic').css('visibility', 'hidden');
            }
            clickNum_period += 1;

        });

        var clickNum_centriod = 0;

        $('#show_centriod_attr').on('click', function () {
            if (clickNum_centriod % 2 == 0) {
                $('#attrPic').css('visibility', 'visible');
            } else {
                $('#attrPic').css('visibility', 'hidden');
            }
            clickNum_centriod += 1;

        });

        $('.year').on('click',function () {
           var year = $(this).text();
           console.log(year);

           var category = ['爆发式增长','快速增长','中速增长','平稳增长','低速增长'];
           switch (year.substr(0,4))
           {
               case '1991':
                   var data = [174,17,6,2,1];
                   break;
               case '1996':
                   var data = [130,47,15,7,1];
                   break;
               case '2001':
                   var data = [100,69,22,6,3];
                   break;
               case '2006':
                   var data = [82,74,33,8,3];
                   break;
           }


            $('#container').highcharts({
                chart: {
                    type: 'column',
                    backgroundColor: 'transparent'
                },
                title: {
                    text: year+'发展类型'
                },
                xAxis: {
                    categories: category,
                    crosshair: true
                },
                yAxis: {
                    min: 0,
                    title: {
                        text: '个数'
                    }
                },
                // tooltip: {
                //     headerFormat: '<span style="font-size:10px">{point.key}</span><table>',
                //     pointFormat: '<tr><td style="color:{series.color};padding:0">{series.name}: </td>' +
                //     '<td style="padding:0"><b>{point.y:.1f} mm</b></td></tr>',
                //     footerFormat: '</table>',
                //     shared: true,
                //     useHTML: true
                // },
                plotOptions: {
                    column: {
                        borderWidth: 0
                    }
                },
                series: [{
                    name: year,
                    data: data
                }]
            });


        });


    });
