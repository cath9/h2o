var new_annotation_start = '';
var new_annotation_end = '';
var just_hidden = 0;
var layer_info = {};
var last_annotation = 0;

jQuery.extend({

  addLayerToCookie: function(cookieName,layerId){
    var currentVals = jQuery.unserializeHash(jQuery.cookie(cookieName));
    currentVals[layerId] = 1;
    var cookieVal = jQuery.serializeHash(currentVals);
    jQuery.cookie(cookieName, cookieVal, {
      expires: 365
    });
  },

  submitAnnotation: function(){
    var collageId = jQuery('.collage-id').attr('id').split('-')[1];
    jQuery('#annotation-form form').ajaxSubmit({
      error: function(xhr){
		jQuery.hideGlobalSpinnerNode();
        jQuery('#new-annotation-error').show().append(xhr.responseText);
      },
      beforeSend: function(){
		jQuery.showGlobalSpinnerNode();
        jQuery('div.ajax-error').html('').hide();
        jQuery('#new-annotation-error').html('').hide();
      },
      success: function(response){
		jQuery.hideGlobalSpinnerNode();
        jQuery.cookie('layer-names', jQuery('#annotation_layer_list').val(), {
          expires: 365
        });
        jQuery('#annotation-form').dialog('close');
        document.location = jQuery.rootPath() + 'collages/' + collageId;
      }
    });
  },

  removeLayerFromCookie: function(cookieName,layerId){
    var currentVals = jQuery.unserializeHash(jQuery.cookie(cookieName));
    delete currentVals[layerId];
    var cookieVal = jQuery.serializeHash(currentVals);
    jQuery.cookie(cookieName,cookieVal,{
      expires: 365
    });
  },

  annotateRange: function(obj) {
    var elStart = parseInt(obj.annotation_start.substring(1));
    var elEnd = parseInt(obj.annotation_end.substring(1));

    //var activeLayers = jQuery.unserializeHash(jQuery.cookie('active-layer-ids'));
	lastLayerId = 0;
	if(obj.layers.length) {
		lastLayerId = obj.layers[obj.layers.length - 1].id;
	}

	var detailNode = jQuery('<span class="annotation-content" id="annotation-content-' + obj.id + '">' + obj.formatted_annotation_content + '&nbsp;&nbsp;<a href="#" class="ann-details" id="ann-details-' + obj.id + '">more</a></span>');

	//TODO: Add these back in for edit mode
    var startArrow = jQuery('<span id="annotation-control-' + obj.id +'" class="arr rc' + (lastLayerId % 10) + '"></span>');
    jQuery("#t" + elStart).before(startArrow);
    jQuery.annotationArrow(startArrow,obj,'start');

    var endArrow = jQuery('<span id="annotation-control-' + obj.id +'" class="arr rc' + (lastLayerId % 10) + '"></span>');
    jQuery("#t" + elEnd).after(detailNode, endArrow);
    jQuery.annotationArrow(endArrow,obj,'end', lastLayerId);

	//TODO: Possibly pull these out to be global listeners? Do perf testing here.
	jQuery('#ann-details-' + obj.id).click(function(e) {
		jQuery.annotationButton(e, obj.id);
	});
	jQuery('#ann-ellipsis-' + obj.id).click(function(e) {
		jQuery('article tt.a' + obj.id).show();
		jQuery('#annotation-control-' + obj.id + ' span').show();
		jQuery(this).hide();
      	e.preventDefault();
	});
  },

  annotationArrow: function(arr,obj,arrowType,layer_id){
    if (arrowType == 'start'){
    	jQuery(arr).html('<span class="control_divider" style="display:none;"></span>');
    } else {
        var ellipsis = jQuery('<a href="#" style="display:none;" class="ann-ellipsis ann-ellipsis-l' + '' + '" id="ann-ellipsis-' + obj.id + '">[...]</a>').insertBefore(arr);
		var star = jQuery('<a class="arrbox">*</a>');
		jQuery.each(obj.layers, function(i, el) {
			ellipsis.addClass('ann-ellipsis-l' + el.id);
			star.addClass('ann-annotation-l' + el.id);
		});
		ellipsis.insertBefore(arr);
		if(obj.annotation_word_count > 0) {
			arr.append(star);
		}
    	arr.append(jQuery('<span class="control_divider" style="display:none;"></span>'));
        //jQuery(arr).html((obj.annotation_word_count > 0) ? ('<span class="arrbox">*</span>') : '');
    }

	if(obj.annotation_word_count > 0) {
    	jQuery(arr).click(function(e){
      		e.preventDefault();
      		jQuery.toggleAnnotation(obj);
    	});
	}

	if(obj.layers.length > 0) {
    	jQuery(arr).hoverIntent({
     		over: function(e){
        		jQuery('.a' + obj.id).css('background', '#' + layer_info['l' + layer_id].hex);
				var layer_names = new Array();
				jQuery.each(obj.layers, function(i, el) {
					layer_names.push(el.name);
				});
				var pos = jQuery(this).position();
				jQuery("#annotation_tip")
					.css({ left: pos.left, top: pos.top + 120 })
					.html(layer_names.join(', '))
					.show(); 
      		}, 
      		timeout: 2000,
      		out: function(e){
       	 		jQuery('.a' + obj.id).css('background', '#FFF');
				jQuery('#annotation_tip').hide();
      		}
    	});
	}
  },

  toggleAnnotation: function(obj) {
	if(jQuery('#annotation-content-' + obj.id).css('display') == 'inline') {
  		jQuery('#annotation-content-' + obj.id).hide();
	} else {
  		jQuery('#annotation-content-' + obj.id).css('display', 'inline');
	}
  },

  annotationButton: function(e,annotationId){
    e.preventDefault();
    var collageId = jQuery('.collage-id').attr('id').split('-')[1];
    if(jQuery('#annotation-details-' + annotationId).length == 0){
      jQuery.ajax({
        type: 'GET',
        cache: false,
        url: jQuery.rootPath() + 'annotations/' + annotationId,
        beforeSend: function(){
			jQuery.showGlobalSpinnerNode();
          jQuery('div.ajax-error').html('').hide();
        },
        error: function(xhr){
			jQuery.hideGlobalSpinnerNode();
          jQuery('div.ajax-error').show().append(xhr.responseText);
        },
        success: function(html){
          // Set up the annotation node to be loaded into a dialog
			jQuery.hideGlobalSpinnerNode();
          var node = jQuery(html);
          jQuery('body').append(node);
          var dialog = jQuery('#annotation-details-' + annotationId).dialog({
            height: 500,
            title: 'Annotation Details',
            width: 600,
            position: [e.clientX,e.clientY - 330],
            buttons: {
              Close: function(){
                jQuery(this).dialog('close');
              },
              Delete: function(){
                if(confirm('Are you sure?')){
                  jQuery.ajax({
                    cache: false,
                    type: 'POST',
                    data: {
                      '_method': 'delete'
                    },
                    url: jQuery.rootPath() + 'annotations/destroy/' + annotationId,
                    beforeSend: function(){
					  jQuery.showGlobalSpinnerNode();
                    },
                    error: function(xhr){
					  jQuery.hideGlobalSpinnerNode();
                      jQuery('div.ajax-error').show().append(xhr.responseText);
                    },
                    success: function(response){
                      jQuery('#annotation-details-' + annotationId).dialog('close');
                      document.location = jQuery.rootPath() + 'collages/' + collageId;
                    },
                    complete: function(){
                      jQuery('#please-wait').dialog('close');
                    }
                  });
                }
              },
              Edit: function(){
                jQuery(this).dialog('close');
                jQuery.ajax({
                  type: 'GET',
                  cache: false,
                  url: jQuery.rootPath() + 'annotations/edit/' + annotationId,
                  beforeSend: function(){
					jQuery.showGlobalSpinnerNode();
                    jQuery('#new-annotation-error').html('').hide();
                  },
                  error: function(xhr){
					jQuery.hideGlobalSpinnerNode();
                    jQuery('#new-annotation-error').show().append(xhr.responseText);
                  },
                  success: function(html){
					jQuery.hideGlobalSpinnerNode();
                    jQuery('#annotation-form').html(html);
                    jQuery.updateAnnotationPreview(collageId);
                    jQuery('#annotation-form').dialog({
                      bgiframe: true,
                      minWidth: 950,
                      width: 950,
                      modal: true,
                      title: 'Edit Annotation',
                      buttons: {
                        'Save': function(){
                          jQuery.submitAnnotation();
                        },
                        Cancel: function(){
                          jQuery('#new-annotation-error').html('').hide();
                          jQuery(this).dialog('close');
                        }
                      }
                    });
                    jQuery("#annotation_annotation").markItUp(myTextileSettings);

                    /*                    jQuery(document).bind('keypress','ctrl+shift+k',
                      function(e){
                      alert('pressed!');
                      jQuery.submitAnnotation();
                      }
                      ); */
                      jQuery('#annotation_layer_list').keypress(function(e){
                        if(e.keyCode == '13'){
                          e.preventDefault();
                          jQuery.submitAnnotation();
                        }
                      });
                  }
                });
              }
            }
          });

          jQuery('#annotation-tabs-' + annotationId).tabs();
          // Wipe out edit buttons if not owner.
          if(!is_owner) {
            jQuery('#annotation-details-' + annotationId).dialog('option','buttons',{
              Close: function(){
                jQuery(this).dialog('close');
              }
            });
          }
        }
      });
    } else {
      jQuery('#annotation-details-' + annotationId).dialog('open');
    }
  },

  initializeAnnotations: function(){
    // This iterates through the annotations on this collage and emits the controls.
    var collageId = jQuery('.collage-id').attr('id').split('-')[1];
    jQuery.ajax({
      type: 'GET',
      url: jQuery.rootPath() + 'collages/annotations/' + collageId,
      dataType: 'json',
      cache: false,
      beforeSend: function(){
		jQuery.showGlobalSpinnerNode();
        jQuery('div.ajax-error').html('').hide();
      },
      success: function(json){
        //stash for later
        //jQuery('body').data('annotation_objects',json);
        jQuery(json).each(function(){
          /* var activeId = false;
          if(window.location.hash){
            activeId = window.location.hash.split('#')[1];
          } */
          jQuery.annotateRange(this.annotation);
        });

		//Later will toggle this if user enters in "edit" mode
        jQuery.unObserveWords();

		jQuery('.unlayered_start').each(function(i, e) {
			var posn = jQuery(e).attr('id').replace(/^t/, '');
			var unlayered_ellipsis = jQuery('<a href="#" style="display:none;" class="unlayered_ellipsis" id="unlayered-ellipsis-' + posn + '">[...]</a>');
			unlayered_ellipsis.click(function(e) {
				jQuery('tt.unlayered_' + posn).show();
				jQuery('#unlayered-ellipsis-' + posn).hide();
      			e.preventDefault();
			});
			unlayered_ellipsis.insertAfter(jQuery('tt.unlayered_' + posn + ':last'));
		});

		jQuery.hideGlobalSpinnerNode();
      },
      complete: function(){
        jQuery('#please-wait').dialog('close');
      },
      error: function(xhr){
		jQuery.hideGlobalSpinnerNode();
        jQuery('div.ajax-error').show().append(xhr.responseText);
      }

    });
  },

  observeLayers: function(){
    var collageId = jQuery('.collage-id').attr('id').split('-')[1];
    jQuery('.layer-control').click(function(e){
      var layerId = jQuery(this).attr('id').split('-')[2];
      if(jQuery('#layer-checkbox-' + layerId).is(':checked')){
        // Set the name and id of the active layers.
        jQuery.addLayerToCookie('active-layer-ids',layerId);
      } else {
        jQuery.removeLayerFromCookie('active-layer-ids',layerId);
      }
    });
  },

  updateCollagePreview: function(){
    jQuery("#collage_description").observeField(5,function(){
      jQuery.ajax({
        cache: false,
        type: 'POST',
        url: jQuery.rootPath() + 'collages/description_preview',
        data: {
          preview: jQuery('#collage_description').val()
        },
        success: function(html){
          jQuery('#collage_preview').html(html);
        }
      });
    });
  },

  updateAnnotationPreview: function(collageId){
    jQuery("#annotation_annotation").observeField(5,function(){
      jQuery.ajax({
        cache: false,
        type: 'POST',
        url: jQuery.rootPath() + 'annotations/annotation_preview',
        data: {
          preview: jQuery('#annotation_annotation').val(),
          collage_id: collageId
        },
        success: function(html){
          jQuery('#annotation_preview').html(html);
        }
      });
    });
  },

  wordEvent: function(e){
  	var el = jQuery(this);
    if(e.type == 'mouseover'){
      el.addClass('annotation_start_highlight');
    }
    if(e.type == 'mouseout'){
      el.removeClass('annotation_start_highlight');
    } else if(e.type == 'click'){
      e.preventDefault();
      if(new_annotation_start != '') {
		new_annotation_end = el.attr('id');
        var collageId = jQuery('.collage-id').attr('id').split('-')[1];
        jQuery('#annotation-form').dialog({
          bgiframe: true,
          autoOpen: false,
          minWidth: 950,
          width: 950,
          modal: true,
          title: 'New Annotation',
          buttons: {
            'Save': function(){
              jQuery.submitAnnotation();
            },
            'Cancel': function(){
              jQuery('#new-annotation-error').html('').hide();
              el.dialog('close');
            }
          }
        });
        jQuery.ajax({
          type: 'GET',
          url: jQuery.rootPath() + 'annotations/new',
          data: {
            collage_id: collageId,
            annotation_start: new_annotation_start,
            annotation_end: new_annotation_end
          },
          cache: false,
          beforeSend: function(){
			jQuery.showGlobalSpinnerNode();
            jQuery('div.ajax-error').html('').hide();
          },
          success: function(html){
			jQuery.hideGlobalSpinnerNode();
            jQuery('#annotation-form').html(html);
            jQuery('#annotation-form').dialog('open');
            jQuery("#annotation_annotation").markItUp(myTextileSettings);
              jQuery('#annotation_layer_list').keypress(function(e){
                if(e.keyCode == '13'){
                  e.preventDefault();
                  jQuery.submitAnnotation();
                }
              });
              jQuery.updateAnnotationPreview(collageId);
              if(jQuery('#annotation_layer_list').val() == ''){
                jQuery('#annotation_layer_list').val(jQuery.cookie('layer-names'));
              }
          },
          error: function(xhr){
			jQuery.hideGlobalSpinnerNode();
            jQuery('div.ajax-error').show().append(xhr.responseText);
          }
        });

		jQuery("#tooltip").fadeOut();
        new_annotation_start = '';
        new_annotation_end = '';
      } else {
		var pos = el.position();
		jQuery("#tooltip").css({ left: pos.left - 100 + el.width()/2, top: pos.top + 100 }).fadeIn();
        new_annotation_start = el.attr('id');
      }
    }
  },

  observeWords: function(){
    // This is a significant burden in that it binds to every "word node" on the page, so running it must
    // align with the rights a user has to this collage, otherwise we're just wasting cpu cycles. Also
    // the controller enforces privs - so feel free to fiddle with the DOM, it won't get you anywhere.
    // jQuery('tt:visible') as a query is much less efficient - unfortunately.

    if(is_owner) {
  	  jQuery('tt').unbind('mouseover mouseout click');
      jQuery('tt').bind('mouseover mouseout click', jQuery.wordEvent);
    }
	jQuery('.ann-details').show();
  },

  unObserveWords: function() {
  	jQuery('tt').unbind('mouseover mouseout click');
	jQuery('.ann-details').hide();
  }

});

jQuery(document).ready(function(){
  /*
  if(jQuery('#collage_description').length > 0){
    jQuery("#collage_description").markItUp(myTextileSettings);
    jQuery.updateCollagePreview();
  }
  jQuery("#annotation_annotation").markItUp(myTextileSettings);
  */

  /* Things related to page loading: what to show & hide */
  if(jQuery('.just_born').length > 0){
    // New collage. Deactivate control.
    jQuery.cookie('hide-non-annotated-text', null);
  }

  if(jQuery.cookie('hide-non-annotated-text') == 'hide'){
    jQuery('#hide-non-annotated-text').attr('checked',true);
  }

  jQuery('#hide-non-annotated-text').click(function(e){
    if(jQuery.cookie('hide-non-annotated-text') == 'hide'){
      jQuery.cookie('hide-non-annotated-text',null);
      jQuery('#hide-non-annotated-text').attr('checked',false);
    } else {
      jQuery.cookie('hide-non-annotated-text','hide',{
        expires: 365
      });
      jQuery('#hide-non-annotated-text').attr('checked',true);
    }
  });


  if(jQuery('.collage-id').length > 0){
  	jQuery('#cancel-annotation').click(function(e){
    	e.preventDefault();
		jQuery("#tooltip").hide();
    	new_annotation_start = '';
		new_annotation_end = '';
 	});

    jQuery.initializeAnnotations();

	jQuery('#full_text').click(function(e) {
      	e.preventDefault();
		jQuery('article tt').show();
		jQuery('.ann-ellipsis').hide();
		jQuery('#layers a strong').html('HIDE');
		jQuery('#layers .shown').removeClass('shown');

        jQuery('article .unlayered').show();
		jQuery('article .unlayered_ellipsis').hide();
	});

	jQuery('#hide_show_unlayered').click(function(e) {
      	e.preventDefault();
		jQuery.showGlobalSpinnerNode();
		var el = jQuery(this);
		el.toggleClass('shown');
		if(el.find('strong').html() == 'SHOW') {
        	jQuery('article .unlayered').show();
			jQuery('article .unlayered_ellipsis').hide();
			el.find('strong').html('HIDE');
		} else {
        	jQuery('article .unlayered').hide();
			jQuery('article .unlayered_ellipsis').show();
			el.find('strong').html('SHOW');
		}
		jQuery.hideGlobalSpinnerNode();
	});

	/* TODO: Possibly add some abstraction here */
	jQuery('#hide_show_annotations').click(function(e) {
      	e.preventDefault();
		jQuery.showGlobalSpinnerNode();

		var el = jQuery(this);
		el.toggleClass('shown');
		if(el.find('strong').html() == 'SHOW') {
        	jQuery('.annotation-content').show();
			el.find('strong').html('HIDE');
		} else {
        	jQuery('.annotation-content').hide();
			el.find('strong').html('SHOW');
		}
		jQuery.hideGlobalSpinnerNode();
	});

	jQuery('#layers .hide_show').click(function(e) {
      	e.preventDefault();
		jQuery.showGlobalSpinnerNode();

		var el = jQuery(this);
		var layer_id = el.parent().data('id');
		//Note: Toggle here was very slow 
		if(el.find('strong').html() == 'SHOW') {
			el.find('strong').html('HIDE');
        	jQuery('article .' + layer_id + ',.ann-annotation-' + layer_id).show();
			jQuery('.ann-ellipsis-' + layer_id).hide();
		} else {
			el.find('strong').html('SHOW');
        	jQuery('article .' + layer_id + ',.ann-annotation-' + layer_id).hide();
			jQuery('.ann-ellipsis-' + layer_id).show();
		}
		jQuery.hideGlobalSpinnerNode();
	});
	jQuery('#layers .link-o').click(function(e) {
		var el = jQuery(this);
		if(el.hasClass('highlighted')) {
        	jQuery('.' + el.parent().data('id')).css('background', '#FFF');
			el.removeClass('highlighted').html('HIGHLIGHT');
		} else {
        	jQuery('.' + el.parent().data('id')).css('background', '#' + el.parent().data('hex'));
			el.addClass('highlighted').html('UNHIGHLIGHT');
		}
      	e.preventDefault();
	});

	jQuery("#edit-show").click(function(e) {
		var el = jQuery(this);
		if(el.hasClass('editing')) {
			el.html("EDIT");	
       		jQuery.unObserveWords();
			jQuery('details .edit-action, .control_divider').hide();
			jQuery('article tt.a').removeClass('edit_highlight');
		} else {
			el.html("READ");	
       		jQuery.observeWords();
			jQuery('details .edit-action').show();
			jQuery('.control_divider').css('display', 'inline-block');
			jQuery('article tt.a').addClass('edit_highlight');
		}
		el.toggleClass('editing');
      	e.preventDefault();
	});

	jQuery('#layers li').each(function(i, el) {
		layer_info[jQuery(el).data('id')] = {
			'hex' : jQuery(el).data('hex'),
			'name' : jQuery(el).data('name')
		};
		jQuery(el).find('.link-o').css('background', '#' + jQuery(el).data('hex'));
	});
  }
});
