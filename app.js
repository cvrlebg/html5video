define(['jquery', "videojs", 'mwLoader'], function($, vjs) {
    'use strict';
    kWidget.getSources({
        'partnerId': 676152,
        'entryId': window.entryId,
        'callback': function(data){

            if(typeof(data.entryId) !== 'undefined') {
                var videoTags = document.getElementsByClassName('dvjs');
                
                for(var i = 0; i < videoTags.length; i++) {
                    var test = vjs(videoTags[i]).ready(function() {
                        var pl = this;
                        var posterImg = data.poster + '/width/700';
                        var source = new Array();

                        console.log('player ready');
                        pl.poster(posterImg);
                        pl.muted(true);

                        data.sources.forEach(function(k, v) {
                            if(k.type === 'video/h264' && (/(a.mp4)/).test(k.src)) {
                                var sourceData = {
                                    'type': k.type.replace('video/h264', 'video/mp4'),
                                    'src': k.src
                                };
                                source.push(sourceData);
                            }
                        });

                        pl.src(source);
                    });
                    console.log(test);
                }
                    
            } else {
                console.log('Check entryId or kaltura service.');
            }          
        }
    });

});