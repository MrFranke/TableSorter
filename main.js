(function( $ ) {

$.fn.DndTable = function( options ) {

    var settings = $.extend({
        CSS_CLASS: 'js-dnd',
        drop: null,               // Элемент в который можно перетащить строку
        draggableClasses: null,   // Классы, для таблицы, которая создаетс для анимации перетаскивания элемента
        errorClasses: null,       // Эти классы будут навещиваться на перетаскиваемый элемент во время ошибки
        sort: true,               // Вклюение/отключение сортировки в $drop таблице
        dropSize: Infinity        // Максимальный размер $drop таблицы
    }, options);
    
    var DndTable = function ( $drag ) {

        var $drop           // Таблица, куда можно перетаскивать
          , $draggable      // Элемент, который остается в $drop при перетаскивании
          , $clone          // Клон строки с обвязкой в виде таблицы. Этот элемент следует за курсором
          , $cloneTR        // Клон строки, которую нужно переместить. Этот элемент используется для фантома. Он же остается в $drop таблице

          , role                // Назначении таблицы (drag||drop), из которой тянут элемент
          , numDropElms         // То, сколько элементов в таблице drop
          , clickable           // Если true, можно перетаскивать элементы, tесли fals
          ;

        function init () {
            updateVars();
            bindEvents();
        }

        function bindEvents () {
            $drag.on( 'mousedown.DndTable', 'tr',  drag);
            // Если включена сортировка верхний таблицы
            if (settings.sort) {$drop.on( 'mousedown.DndTable', 'tr',  drag);}
        }

        function updateVars () {
            $drop = settings.drop;

            // Настройки через data-* атребуты
            settings.dropSize = $drop.data('size')? $drop.data('size') : settings.dropSize;
            settings.sort = $drop.data('sort')? $drop.data('sort') : settings.sort;

            numDropElms = $drop.find('tr').not('[data-nodrag]').length;

            if ( !settings.draggableClasses ) {
                settings.draggableClasses = $drop.attr('class');
            }
        }

        /**
         * Функция перетаскивания объекта
         */
        function drag (e) {
            if ( $(this).data('nodrag') ) {return false;}

            var $choise = $(this)
              , $target = $(e.target)
              // хаки для FF
              , offsetX = e.offsetX || e.clientX - $(e.target).offset().left
              , offsetY = e.offsetY || e.clientY - $(e.target).offset().top;
              ;

            role = $choise.parents('table').data('role');
            
            // Делаем перемещаемый элемент прозрачным
            $draggable = $choise.css({opacity: 0.5});
            
            // Клонируем элементы
            $clone =  makeDraggableEl( $draggable.clone() );
            $cloneTR = $draggable.clone();
            //Сохраняем ширину элемента при перетаскивани
            $clone.css({width: $choise.width()});
            $('body').append( $clone );


            // Если элемент перетаскивают из дроп зоны (сортируют)
            if ( role === 'drop' ) {
                // При сортировке в дропзоне, не нужно показывать фантом
                $draggable.hide();
            }
            // Проверяем смещение
            if ( $target !== $choise ) {
                offsetX += $target.offset().left;
            }
            
            offsetX -= $target.parents('table').offset().left;
            
            $clone.css({
                left: e.pageX - offsetX,
                top: e.pageY - offsetY
            });

            // Когда отпускаем мышку, перестаем перемещать элемент
            $(document).bind('mouseup.DndTable', function (e) {
                $(document).unbind('mouseup.DndTable');
                $(document).unbind('mousemove.DndTable');
                // Если отпустили в дропзоне, перемещаем элемент. Иначе возвращаем обратно
                if ( checkDropZone(e.pageX, e.pageY) ) {
                    var pos = getPositionDropZone(e.pageX, e.pageY);
                    drop(pos);
                }else{
                    returnEl();
                }

                e.preventDefault();
                return false;
            });

            // Перемещаем элемент при движении мышки
            $(document).bind('mousemove.DndTable', function (e){
                $('.dragndrop').css({cursor: 'default'});

                $clone.css({
                    left: e.pageX - offsetX,
                    top: e.pageY - offsetY,
                });


                // Если элемент в дропзоне, показываем пользователю его "фантом"
                if ( checkDropZone(e.pageX, e.pageY) ) {
                    var pos = getPositionDropZone(e.pageX, e.pageY);
                    dropFantom(pos);
                }

                e.preventDefault();
                return false;
            });
        }

        /**
         * Перемещает элемент в нужную таблицу
         * @param pos {Number} индекс элемента, после которого будет следовать перенесенный
         */
        function drop ( pos ) {
            // Если элементов уже достаточно, не даем положить элемент
            if ( settings.dropSize === numDropElms && role !== 'drop' ) {
                returnEl();
                return false;
            }

            // Перемещаем элемент с курсора в drop таблицу
            var offset = $cloneTR.offset();
            $clone.animate({
                top: offset.top,
                left: offset.left
            }, function () {
                // Показываем клон в drop таблице
                $cloneTR.css({opacity: 1});
                $clone.remove()
                $draggable.remove();
                
                // Увеличиваем колличество элеаентов только когда перетаскиваем их в дроп зону
                if ( role === 'drag' ) {numDropElms++;}
            });
        }

        function dropFantom (pos) {
            $clone.addClass(settings.errorClasses);
            $cloneTR.css({opacity: 0.5});
            $drop.find('tr').eq(pos).after( $cloneTR );
        }

        /**
         * Возвращает элемент на его начальную позицию
         */
        function returnEl () {
            // Убираем элемент из $drop таблицы
            if ( role === 'drop' ) {
                $draggable.prependTo($drag).show();
                numDropElms--;
            }

            $clone.animate({
                top: $draggable.offset().top,
                left: $draggable.offset().left
            }, function () {
                $clone.remove();
                $cloneTR.remove();
                $draggable.css({opacity: 1});
            });
        }

        /**
         * Проверяет координаты на попадание в дроп-зону
         * @param x,y {Number} координаты, которые нужно проверить
         * @returns {Boolian}
         */
        function checkDropZone (x,y) {
            var check = checkCoords({
                    x: x, 
                    y: y
                },
                    
                {
                    top: $drop.offset().top,
                    left: $drop.offset().left,
                    width: $drop.width(),
                    height: $drop.height()
                });

            return check;
        }

        /**
         * Проверяет попадают ли координаты в переданную область
         * @param coords {Object} объект с координатами x,y
         * @param size {Object} объект в котором хронится верхняя точка (left,top) и размеры области (height,width)
         */
        function checkCoords (coords, size) {
            var checkX = (coords.x > size.left && coords.x < size.left + size.width)
              , checkY = (coords.y > size.top && coords.y < size.top + size.height)

            return checkX && checkY;   
        }

        /**
         * Определяет позицию, куда переместить элемент в таблицу
         * @param x,y {Number} Координаты, куда был дропнут элемент
         * @returns pos {Number} Позиция элемента в таблице
         */
        function getPositionDropZone (x,y) {
            var $items = $drop.find('tr')
              , pos = null;

            $items.each(function () {
                var check = checkCoords({x:x,y:y},{
                    top: $(this).offset().top,
                    left: $(this).offset().left,
                    width: $(this).width(),
                    height: $(this).height()
                });
                
                if (check) { 
                    var offset = y - $(this).offset().top;
                    
                    pos = $(this).index();

                    // Если курсор ближе к верхнему краю элемента, добовляем перед ним, а не после
                    if ( offset < $(this).height()/2 ) {
                        pos = $(this).index()-1;
                        pos = pos < 0? 0 : pos;
                        return false;
                    }
                }
            });

            return pos;
        }

        /**
         * Создает обвязку в виде таблицы вокруг перемещяемого элемента.
         */
        function makeDraggableEl ( part ) {
            var tmp = '<table class="'+settings.draggableClasses+'"></table>'
              , $el = $(tmp).css({position: 'absolute'}).append(part);

            return $el;
        }

        
        /**
         * ================== API ===============================
         */

        /**
         * Меняет максимальное колличество элементов в drop-таблице
         * @param m {Number} Значения максимального числа
         */
        function setDropSize ( n ) {
            var diff = n - numDropElms
              , items = $drop.find('tr').not('[data-nodrag]')
              , overdrawItems = items.slice(diff)
              ;

            settings.dropSize = n;

            if ( diff < 0 ) {
                numDropElms += diff;
                overdrawItems.each(function(){ $(this).appendTo($drag); }); // Вставляем последнии элементы  в drag таблицу
            }
        }
        
        init();

        return{
            setDropSize: setDropSize
        }
    }

    var setOfEl = []; // Массив из возвращаемых элементов API

    // Проходимся по всем элементам
    this.each(function () {
        var dnd = new DndTable( $(this) );
        setOfEl.push( dnd );
    });

    // Возвращаем объекты слайдера для использония их API ( Пример: $('#slider').jSlider().stopAutoRatating() )
    return setOfEl.length === 1? setOfEl[0] : setOfEl;
}

})(jQuery);