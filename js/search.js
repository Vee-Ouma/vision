﻿var sphCylFormat = function (num) {
    if (num === null)
        return '';
    else
        return (num >= 0) ? '+' + num.toFixed(2) : num.toFixed(2);
};
var axisFormat = function (num) {
    if (num < 10)
        return '00' + num;
    else if (num < 100)
        return '0' + num;
    else
        return num;
};
var formToJson = function (form) {
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
    var currentSearchType = 'rx';
    var clickedGlassesCallNumber = { group: 0, number: 0 };

    // search type choosing
    $('input[name=searchType]').click(function () {
        if ($(this).val() === 'rx' && !$('#rxform').is(':visible')) {
            $('#callnumsearchform').slideUp();
            $('#rxform').slideDown();
            currentSearchType = $(this).val();
        }
        if ($(this).val() === 'callnum' && !$('#callnumsearchform').is(':visible')) {
            $('#callnumsearchform').slideDown();
            $('#rxform').slideUp();
            currentSearchType = $(this).val();
        }
    });

    // binding submit search query button
    $('#submit').click(function (e) {
        e.preventDefault();
        var glasses, url;
        if (currentSearchType === 'rx') {
            url = '/search/fuzzysearch';
            glasses = { search: formToJson($('#rxform').find('input,select')) };
        }
        else {
            url = '/search/CallNumberSearch';
            glasses = { group: $('#group').val(), number: $('#number').val() };
        }

        $('#rxList').html('');
        $('#searchWaiting').show();
        $.ajax({
            url: url,
            type: 'POST',
            dataType: 'json',
            data: JSON.stringify(glasses),
            contentType: 'application/json; charset=utf-8',
            success: function (msg) {
                $('#searchWaiting').hide();
                $('#rxTemplate').tmpl(msg).appendTo('#rxList');
            }
        });
    });

    // bind clear button
    $('#clear').click(function (e) {
        e.preventDefault();
        $('#rxform').find('.rx_box').each(function () { $(this).val(''); });
        $('#rxform').find('select').each(function () { $(this).val('U'); });
        $('#rxList').html('');
    });

    // bind for clicking on a row
    $('.resultRow').live('click', function (event) {
        var callNumber = $(this).find('.group').text().split('/');
        clickedGlassesCallNumber.group = callNumber[0];
        clickedGlassesCallNumber.number = callNumber[1];
        $.blockUI({ message: $('#action'), css: { width: '500px'} });
    });

    // bind for hovering over rows and highlighting properly
    $('.resultRow').live('mouseover mouseout', function (event) {
        // user "event.type == 'mouseover'" if you want to have diff behaviour
        $(this).find('td').toggleClass('rowHover');
    });

    // bind edit button (in modal)
    $('#edit').click(function (e) {
        e.preventDefault();
        $.unblockUI();
    });

    // bind remove button (in modal)
    $('#remove').click(function (e) {
        e.preventDefault();
        $.post('add/remove', clickedGlassesCallNumber, function (msg) {
            $.unblockUI();
            $('#submit').click();
        });
    });

    // bind do nothing button (in modal)
    $('#doNothing').click(function (e) {
        e.preventDefault();
        $.unblockUI();
    });
});