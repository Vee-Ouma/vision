﻿var formToJson = function (form) {
    var glasses = {};
    form.each(function (index) {
        switch ($(this).attr('type')) {
            case 'button':
                break;
            case 'checkbox':
                glasses[$(this).attr('name')] = $(this).is(':checked');
                break;
            default:
                glasses[$(this).attr('name')] = $(this).val();
        }
    });
    return glasses;
};

$(document).ready(function () {
    var glassesBatch = new Array();

    // bind to send batch button
    $('#sendBatch').click(function (e) {
        var glassesBatchPostData = { callnumbers: $.map(glassesBatch, function (n, i) { return n.Group + '/' + n.Number; }).join(',') };
        $.post('/Add/AddToGlassesBatches', glassesBatchPostData, function (msg) {
            glassesBatch = new Array();

            // reset display counter to 0
            $('#glassesBatchCount').text(glassesBatch.length);

            // hide message about batch being done
            $('#batchDoneMsg').hide();

            // if hidden, show hide button again
            if ($('#add').hasClass('hidden'))
                $('#add').toggleClass('big button hidden');

            // tell what the batch number is
            $('#addMsg').prepend('<h3>'+msg+'</h3><p>Please handoff box of glasses with the batch #.</p>');
        });
    });

    // add button click
    $('#add').click(function (e) {
        e.preventDefault();
        $('#add').attr('disabled', 'disabled');
        $('#addWaiting').show();
        var glasses = formToJson($('#rxform').find('input,select'));
        var errMsg = '';
        var rxValRangeCheck = function (property, min, max, optional) {
            if (glasses[property] === '' && !optional)
                errMsg += property + ' missing<br />';
            if (glasses[property] < min || glasses[property] > max)
                errMsg += property + ' must be between ' + min + ' and ' + max + '<br />';
        };

        rxValRangeCheck('OD_Spherical', -20, 20);
        rxValRangeCheck('OD_Cylindrical', -20, 0, true);
        rxValRangeCheck('OD_Axis', 0, 180, true);
        rxValRangeCheck('OD_Add', 0, 10, true);
        rxValRangeCheck('OS_Spherical', -20, 20);
        rxValRangeCheck('OS_Cylindrical', -20, 20, true);
        rxValRangeCheck('OS_Axis', 0, 180, true);
        rxValRangeCheck('OS_Add', 0, 10, true);

        if (errMsg != '') {
            if (console) console.log(errMsg);
            $('#addErr').html(errMsg).fadeIn(200);
            $('#add').removeAttr('disabled');
            $('#addWaiting').hide();
        }
        else {
            $('#addErr').fadeOut(200);
            $.ajax({
                url: '/Add/Add',
                type: 'POST',
                dataType: 'json',
                data: JSON.stringify(glasses),
                contentType: 'application/json; charset=utf-8',
                success: function (msg) {
                    msg.Glasses = glasses;
                    $('#addMsgTmpl').tmpl(msg).prependTo('#addMsg');

                    $('#add').removeAttr('disabled');
                    $('#addWaiting').slideUp();

                    // clear form so user can add next pair of glasses
                    $('#rxform').find('.rx_box').each(function () { $(this).val(''); });
                    $('#rxform').find('.rx_checkbox').each(function () { $(this).prop('checked', false); });
                    $('#rxform').find('select').each(function () { $(this).val('U'); });

                    glassesBatch.push(msg);
                    $('#glassesBatchCount').text(glassesBatch.length);
                    if (glassesBatch.length === 40) {
                        $('#add').toggleClass('big button hidden');
                        $('#batchDoneMsg').show();
                    }
                },
                error: function (msg) {
                    $('#addErr').html('Error Adding').fadeIn(200);
                    $('#add').removeAttr('disabled');
                    $('#addWaiting').hide();
                }
            });
        }
    });

    $('#clear').click(function (e) {
        e.preventDefault();
        $('#rxform').find('.rx_box').each(function () { $(this).val(''); });
        $('#rxform').find('select').each(function () { $(this).val('U'); });
        $('#addErr').fadeOut(200);
    });
});