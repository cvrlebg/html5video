(function(kWidget) {
    "use strict"
    if (!kWidget) {
        kWidget = window.kWidget = {};
    }
    kWidget.api = function(options) {
        return this.init(options);
    };
    kWidget.api.prototype = {ks: null,type: 'auto',baseParam: {'apiVersion': '3.1','expiry': '86400','clientTag': 'kwidget:v' + window['MWEMBED_VERSION'],'format': 9,'ignoreNull': 1},init: function(options) {
            for (var i in options) {
                this[i] = options[i];
            }
            if (!this.serviceUrl) {
                this.serviceUrl = mw.getConfig('Kaltura.ServiceUrl');
            }
            if (!this.serviceBase) {
                this.serviceBase = mw.getConfig('Kaltura.ServiceBase');
            }
            if (!this.statsServiceUrl) {
                this.statsServiceUrl = mw.getConfig('Kaltura.StatsServiceUrl');
            }
            if (typeof this.disableCache == 'undefined') {
                this.disableCache = mw.getConfig('Kaltura.NoApiCache');
            }
        },setKs: function(ks) {
            this.ks = ks;
        },getKs: function() {
            return this.ks;
        },doRequest: function(requestObject, callback, skipKS, errorCallback) {
            var _this = this;
            var param = {};
            var globalCBName = null;
            if (this.disableCache === true) {
                param['nocache'] = 'true';
            }
            for (var i in this.baseParam) {
                if (typeof param[i] == 'undefined') {
                    param[i] = this.baseParam[i];
                }
            }
            ;
            if (
            requestObject['service'] != 'user' && !skipKS) {
                kWidget.extend(param, this.handleKsServiceRequest(requestObject));
            } else {
                kWidget.extend(param, requestObject);
            }
            param['kalsig'] = this.hashCode(kWidget.param(param));
            var serviceType = param['service'];
            delete param['service'];
            var timeoutError = setTimeout(function() {
                if (globalCBName) {
                    window[globalCBName] = undefined;
                }
                if (errorCallback) {
                    errorCallback();
                }
            }, mw.getConfig("Kaltura.APITimeout"));
            var handleDataResult = function(data) {
                clearTimeout(timeoutError);
                data = data || [];
                if (data.length > 1 && param['1:service'] == 'session') {
                    _this.setKs(data[0].ks);
                    if (data.length == 2) {
                        data = data[1];
                    } else {
                        data.shift();
                    }
                }
                if (callback) {
                    callback(data);
                    callback = null;
                }
            };
            try {
                param['format'] = 1;
                this.xhrRequest(_this.getApiUrl(serviceType), param, function(data) {
                    handleDataResult(data);
                });
            } catch (e) {
                param['format'] = 9;
                var requestURL = _this.getApiUrl(serviceType) + '&' + kWidget.param(param);
                globalCBName = 'kapi_' + Math.abs(_this.hashCode(kWidget.param(param)));
                if (window[globalCBName]) {
                    this.callbackIndex++;
                    globalCBName = globalCBName + this.callbackIndex;
                }
                window[globalCBName] = function(data) {
                    handleDataResult(data);
                    window[globalCBName] = undefined;
                    try {
                        delete window[globalCBName];
                    } catch (e) {
                    }
                }
                requestURL += '&callback=' + globalCBName;
                kWidget.appendScriptUrl(requestURL);
            }
        },xhrRequest: function(url, param, callback) {
            var requestMethod = this.type == "auto" ? ((kWidget.param(param).length > 2000) ? 'xhrPost' : 'xhrGet') : ((this.type == "GET") ? 'xhrGet' : 'xhrPost');
            this[requestMethod](url, param, callback);
        },parseResponse: function(data) {
            var response = data;
            try {
                response = JSON.parse(data);
            } catch (e) {
            }
            return response;
        },xhrGet: function(url, param, callback) {
            var _this = this;
            var xmlhttp = new XMLHttpRequest();
            xmlhttp.onreadystatechange = function() {
                if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
                    callback(_this.parseResponse(xmlhttp.responseText));
                }
            }
            xmlhttp.open("GET", url + '&' + kWidget.param(param), true);
            xmlhttp.send();
        },xhrPost: function(url, param, callback) {
            var _this = this;
            var xmlhttp = new XMLHttpRequest();
            xmlhttp.onreadystatechange = function() {
                if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
                    callback(_this.parseResponse(xmlhttp.responseText));
                }
            }
            xmlhttp.open("POST", url, true);
            xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
            xmlhttp.send(kWidget.param(param));
        },handleKsServiceRequest: function(requestObject) {
            var param = {};
            if (requestObject['ks']) {
                this.ks = requestObject['ks'];
            }
            if (!requestObject.length && !this.getKs()) {
                requestObject = [requestObject];
            }
            if (requestObject.length) {
                param['service'] = 'multirequest';
                param['action'] = 'null';
                var mulitRequestIndex = 1;
                if (!this.getKs()) {
                    param[mulitRequestIndex + ':service'] = 'session';
                    param[mulitRequestIndex + ':action'] = 'startWidgetSession';
                    param[mulitRequestIndex + ':widgetId'] = this.wid;
                    mulitRequestIndex = 2;
                }
                for (var i = 0; i < requestObject.length; i++) {
                    var requestInx = mulitRequestIndex + i;
                    param[requestInx + ':ks'] = (this.getKs()) ? this.getKs() : '{1:result:ks}';
                    for (var paramKey in requestObject[i]) {
                        if (typeof requestObject[i][paramKey] == 'object') {
                            for (var subParamKey in requestObject[i][paramKey]) {
                                param[requestInx + ':' + paramKey + ':' + subParamKey] = this.parseParam(requestObject[i][paramKey][
                                subParamKey]);
                            }
                        } else {
                            param[requestInx + ':' + paramKey] = this.parseParam(requestObject[i][paramKey]);
                        }
                    }
                }
            } else {
                param = requestObject;
                param['ks'] = this.getKs();
            }
            return param;
        },parseParam: function(data) {
            var param = data;
            if (!this.getKs()) {
                var paramParts = param.toString().match(/\{(\d+)(:result:.*)\}/);
                if (paramParts) {
                    var refObj = parseInt(paramParts[1]) + 1;
                    param = "{" + refObj + paramParts[2] + "}"
                }
            }
            return param;
        },getApiUrl: function(serviceType) {
            var serviceUrl = mw.getConfig('Kaltura.ServiceUrl');
            if (serviceType && serviceType == 'stats' && mw.getConfig('Kaltura.StatsServiceUrl')) {
                serviceUrl = mw.getConfig('Kaltura.StatsServiceUrl');
            }
            if (serviceType && serviceType == 'liveStats' && mw.getConfig('Kaltura.LiveStatsServiceUrl')) {
                serviceUrl = mw.getConfig('Kaltura.LiveStatsServiceUrl');
            }
            return serviceUrl + mw.getConfig('Kaltura.ServiceBase') + serviceType;
        },hashCode: function(str) {
            var hash = 0;
            if (str.length == 0)
                return hash;
            for (var i = 0; i < str.length; i++) {
                var currentChar = str.charCodeAt(i);
                hash = ((hash << 5) - hash) + currentChar;
                hash = hash & hash;
            }
            return hash
            ;
        }}
})(window.kWidget);