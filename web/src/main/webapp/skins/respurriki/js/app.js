/* 
 * Lets automatically convert all images into responsive using jquery and bootstrap
 */
$.noConflict();
jQuery(document).ready(function() {
    jQuery("#mainContentArea img").each(function() {
        jQuery(this).addClass("img-responsive");
    });

    jQuery("#breadcrumb-icon a").click(function() {
        jQuery("#dropable-toc").slideToggle();
        return false;
    });

    jQuery("body").on("click", "#dropable-toc ul li .main-item a.icon-large", function() {
        //lets change the icon arrow
        var item_status = jQuery(this).parent().parent().find('ul').css('display');
        if (item_status === 'none') {
            jQuery(this).removeClass('icon-caret-left').addClass('icon-caret-down');
        } else {
            jQuery(this).removeClass('icon-caret-down').addClass('icon-caret-left');
        }
        jQuery(this).parent().parent().find('ul').slideToggle();
        return false;
    });

    //style tables automatically
    jQuery(".asset-display-text table").addClass('table table-bordered table-hover table-striped');
    //enable tooltips automatically
    jQuery('.has-tooltip').tooltip({
        placement: 'top',
    });

    /*
     jQuery('.wikicreatelink a').append(' <i class="icon-external-link"></i>');
     jQuery('.wikiexternallink a').append(' <i class="icon-external-link"></i>');
     */

    jQuery('.wikicreatelink a').each(function() {
        var the_rel = jQuery(this).attr('rel');
        var the_target = jQuery(this).attr('target');

        if (typeof the_rel !== 'undefined') {
            if (the_rel.indexOf('blank') !== -1) {
                jQuery(this).append(' <i class="icon-external-link"></i>');
            } else {
                if (typeof the_target !== 'undefined') {
                    if (the_target.indexOf('blank') !== -1) {
                        jQuery(this).append(' <i class="icon-external-link"></i>');
                    }
                }
            }
        } else {
            if (typeof the_target !== 'undefined') {
                if (the_target.indexOf('blank') !== -1) {
                    jQuery(this).append(' <i class="icon-external-link"></i>');
                }
            }
        }
    });

    jQuery('.wikiexternallink a').each(function() {
        var the_rel = jQuery(this).attr('rel');
        var the_target = jQuery(this).attr('target');

        if (typeof the_rel !== 'undefined') {
            if (the_rel.indexOf('blank') !== -1) {
                jQuery(this).append(' <i class="icon-external-link"></i>');
            } else {
                if (typeof the_target !== 'undefined') {
                    if (the_target.indexOf('blank') !== -1) {
                        jQuery(this).append(' <i class="icon-external-link"></i>');
                    }
                }
            }
        } else {
            if (typeof the_target !== 'undefined') {
                if (the_target.indexOf('blank') !== -1) {
                    jQuery(this).append(' <i class="icon-external-link"></i>');
                }
            }
        }
    });


});
