TableSorter
===========

Позволяет перетаскивать данные из одной таблицы в другую

**Пример использования:**
```javascript
$elements.filter('[data-role="drag"]').DndTable({
	drop: $elements.filter('[data-role="drop"]')
});
```
**Настройки:**
```javascript
{
  CSS_CLASS: 'js-dnd',    // префикс для класса элементов управления
  drop: null,             // jQuery элемент. Таблица, в которую будем переносить данные из дргой
  draggableClasses: null, // Классы для применения css свойств для таблицы, в которой переносится элемент (по умолчанию берется из таблицы $drop)
  errorClasses: null,     // Эти классы будут навещиваться на перетаскиваемый элемент во время ошибки
  sort: true,             // Вклюение/отключение сортировки в $drop таблице
  dropSize: Infinity      // Максимальный размер $drop таблицы
}
```

TODO:
- Многострочное выделение через shift и ctrl
