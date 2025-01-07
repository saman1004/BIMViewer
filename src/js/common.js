function set_flaot() {

    var hamburger = $('.hamburger');
    var subMenuWrap = $('.sub_menu_wrap');
    var subMenuItems = subMenuWrap.find('.sub_items');
    var ran = subMenuWrap.find("input[type='range']");


    hamburger.on('click', function () {
        console.log('마우스클릭');
        if (hamburger.hasClass('left_bt_home')) {
            console.log('최소화된 플로트 메뉴를 클릭했을때');
            hamburger.removeClass('left_bt_home').addClass('hover_menu click_after_hover');
            subMenuWrap.css({
                transform: 'translateY(100px)',
            });
            subMenuItems.css({
                display: 'none',
            });

            bimViewer.dim.resetDim();
            bimViewer.resetScale();
            bimViewer.resetExplode();
            bimViewer.clipping.resetClipping();
            bimViewer.markUp.resetMarkUp();
            bimViewer.intersectionTest.reset();
            bimViewer.area.reset();
            bimViewer.firstPerson.resetFirstPerson();
            bimViewer.flyView.resetFlyView();
            bimViewer.viewPort.resetViewPort();
            // snap mode 초기화
            document.getElementById('dim_snap').checked = false;
            document.getElementById('area_snap').checked = false;

            ran.css({
                background: "linear-gradient(to right, var(--bim-primary) 0%,  var(--bim-primary) 0% 0%, #d5d4d3 0%, #d5d4d3 100%)"
            })

        } else {
            console.log('hover된 플로트메뉴를 클릭했을때');
            hamburger.removeClass('hover_menu').addClass('left_bt_home');
            subMenuWrap.css({
                transform: 'translateY(0)',
            });
        }
    });

    $('.action_items').on('click', 'div', function () {
        console.log('메뉴클릭');
        var className = $(this).attr('class');
        console.log(className);
        hamburger.removeClass('click_after_hover');
        subMenuWrap.find('.' + className).css({
            display: 'flex',
        });
    });
}

function set_sidemenu() {
    $('.side_menu_wrap .bt_open').click(function () {
        $(this).addClass('hide');
        $('.side_menu_wrap .side_wrapper').addClass('active');
    });
    $('.side_menu_wrap .tab_close').click(function () {
        $('.side_menu_wrap .side_wrapper').removeClass('active');
        $('.side_menu_wrap .bt_open').removeClass('hide');
    });
}

function set_slidebar() {
    $(document).on("click", ".left_bt_home", function() {             
        $(".action_items_bar .action_items input[type='range']").css('background', 'linear-gradient(to right, var(--bim-primary) 0%,  var(--bim-primary) 0% 0%, #d5d4d3 0%, #d5d4d3 100%)');    
    });    
    $("input[type='range']").each(function () {
        var val = $(this).val();
        var minimum = $(this).attr("min");
        var maximum = $(this).attr("max");
        var percent = (val - minimum) / (maximum - minimum) * 100; 
        $(this).css('background', 'linear-gradient(to right, var(--bim-primary) 0%,  var(--bim-primary) 0% '+ percent +'%, #d5d4d3 ' + percent + '%, #d5d4d3 100%)');
    });
    $('input[type=range]').on('input', function(){
        var val = $(this).val();
        var minimum = $(this).attr("min");
        var maximum = $(this).attr("max");
        var percent = (val - minimum) / (maximum - minimum) * 100;
        $(this).css('background', 'linear-gradient(to right, var(--bim-primary) 0%,  var(--bim-primary) 0% '+ percent +'%, #d5d4d3 ' + percent + '%, #d5d4d3 100%)');
    });
}

function set_folding() {
    $(document).on("click", ".tab_cont .info_wrap .info_title", function() {                
        $(this).parent(".tab_cont .info_wrap").toggleClass("folding");        
    });
}

function splitview_select(){
    $('.custom-select input[type=radio]:checked').each(function() {
      var selectedId = $(this).attr('id');
      $('.custom-select label[for=' + selectedId + ']').addClass('active');
    });
  
    $('.split_wrap').each(function() {
      var $splitWrap = $(this);
      
      $splitWrap.find('input[type=radio]').change(function() {
        $splitWrap.find('label').removeClass('active');
        var selectedId = $(this).attr('id');
        $splitWrap.find('label[for=' + selectedId + ']').addClass('active');
        $('details').removeAttr('open');
        bimViewer.viewPort.changeCamera(selectedId.toLowerCase());
      });
    });

    $('details').click(function() {        
      $('details').not(this).removeAttr('open');
    });

    document.querySelector('.split_container .bt_close').addEventListener('click', ()=>{
        $('.hamburger').click();
        document.getElementById('view1Perspective').checked = true
        document.getElementById('view2Top').checked = true
        document.getElementById('view3Front').checked = true
        document.getElementById('view4Right').checked = true

        let $splitContainer = document.querySelector('.split_container');
        $splitContainer.querySelectorAll('label').forEach((ele)=>{
            ele.classList.remove('active');
        })

        $('.custom-select input[type=radio]:checked').each(function() {
            var selectedId = $(this).attr('id');
            $('.custom-select label[for=' + selectedId + ']').addClass('active');
        });
    })
}