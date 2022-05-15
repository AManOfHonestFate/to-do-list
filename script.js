const placeholders = ['go shopping', 'feed my dog', 'learn js', 'call mom', 'visit doctor', 'walk cat', 'do homework', 'make sandwich', 'book hotel', 'order pizza', 'learn css', 'learn html']

let currentFilter = {
    dragging: false,
    text: ''
}


$('.container input').attr('placeholder',
    placeholders[Math.floor(Math.random() * placeholders.length + 1)])

let tasksManager = {
    allTasks: null,
    saveTasks() {
        this.allTasks = {}
        $('.list li').each(function(idx) {
            const el = $(this);
            tasksManager.allTasks[idx] = {
                text: el.children('p').text(),
                completed: el.data('completed'),
                filter: el.data('filter')
            };
        });
    }
}

let groupManager = {
    allGroups: null,
    getFirstFreeIndex() {
        let i = 0;
        for (i; ; i++) {
            if (!(i in this.allGroups)) break;
        }
        return i;
    },
    addNewGroup(text) {
        const id = this.getFirstFreeIndex();
        this.allGroups[id] = {text: text};
        return id;
    },
    deleteGroup(id) {
        delete this.allGroups[id];
    }
}

window.addEventListener('unload', () => {
    tasksManager.saveTasks();
    localStorage.setItem('tasks', JSON.stringify(tasksManager.allTasks));
    localStorage.setItem('groups', JSON.stringify(groupManager.allGroups));
})

groupManager.allGroups = JSON.parse(localStorage.getItem('groups'));
tasksManager.allTasks = JSON.parse(localStorage.getItem('tasks'));
let loading = true;

if (!groupManager.allGroups) {
    groupManager.allGroups = {};
} else for (let i in groupManager.allGroups) {
    addGroup(groupManager.allGroups[i].text, i);
}

if (!tasksManager.allTasks) {
    tasksManager.allTasks = {};
    loading = false;
} else {
    for (let i in tasksManager.allTasks) {
        addTask(tasksManager.allTasks[i].text, i, tasksManager.allTasks[i].completed, tasksManager.allTasks[i].filter);
    }
    loading = false;
}

$('.list').sortable();

function addTask(text, idx = 0, completed = false, filter = '') {
    let id = idx;

    $('.container input')
        .val('')
        .attr('placeholder', placeholders[Math.floor(Math.random() * placeholders.length + 1)]);

    const $newToDo = $(`<li><p>${text}</p><button></button><div class="group"></div></li>`) 
        .data({
            'completed': completed,
            'id': id,
            'filter': filter
        })
        .slideUp(10)
        .appendTo($('.list'))
        .slideDown(150)
        .click(function() {
            const newState = !($(this).data('completed'));
            $(this)
                .data('completed', newState)
                .children('p')
                .toggleClass('strike');
        })
        .hover(function () {
            if (currentFilter.dragging) $(this).css({
                'padding-top': '0.7em',
                'padding-bottom': '0.3em'
            })
        }, function () {
            $(this).css({
                'padding-top': '0.25em',
                'padding-bottom': '0.25em'
            })
        })
        .on('mouseup', function () {
            if (currentFilter.dragging) {
                $(this).css({
                    'padding-top': '0.7em',
                    'padding-bottom': '0.3em'
                })
                .data('filter', currentFilter.text)
                .children('.group')
                .text(currentFilter.text.slice(0, 10) + (currentFilter.text.length > 11 ? '...' : ''));
            }
        });

    if (filter) $newToDo.children('.group').text(filter.slice(0, 10) + (filter.length > 11 ? '...' : ''))

    if (completed) $newToDo.children('p').addClass('strike');

    $newToDo.children('button')
        .click((e) => {
            e.stopPropagation();

            $newToDo.slideUp(() => {
                $newToDo.remove();
            });
        });
}

function addToDO(e) {
    e.preventDefault();
    const text = $('input').val();

    if (!text) return;

    addTask(text);
}

$('.container form').submit(addToDO).on('input', function() {
    $('input').attr('placeholder', '')
})

function filter() {
    $('.current').removeClass('current');
    const index = $(this).addClass('current').index();
    
    const toDos = $('.list li');
    if (index === 0) toDos.show()
    else if (index < 3) toDos.each(function() {
        const el = $(this);
        if (el.data('completed')) {
            index === 1 ? el.show() : el.hide();
        } else {
            index === 2 ? el.show() : el.hide();
        }
    })
    else toDos.each(function () {
        const el = $(this);
        if (el.data('filter')=== $('.current').text()) {
            el.show();
        } else el.hide();
    });
}

$('.filters li:not(:last-of-type)').click(filter);

function addSelector() {
    $(this).hide();
    $('.filters input').show().focus();
}

function addGroup(text, idx = 0) {
    const addButton = $('.filters li:last-of-type');

    let id = idx;
    if (!loading) id = groupManager.addNewGroup(text);

    $(`<li>${text}<button></button></li>`)
        .data('id', id)
        .click(filter)
        .insertBefore(addButton)
        .draggable({
            helper: function() {
              return $( `<p>${text}</p>` );
            }
        })
        .on('dragstart', function() {
            currentFilter.dragging = true;
            currentFilter.text = $(this).text();
        })
        .on('dragstop', function() {
            currentFilter.text = ''
            currentFilter.dragging = false;
        })
        .children('button')
        .click(function() {
            groupManager.deleteGroup(id);
            $(this).parent().remove();
        });

    addButton.show();
}

function group(e) {
    e.preventDefault();
    const input = $('.filters input');
    const text = input.val();
    input.val('');
    addGroup(text);
    input.hide();
}

$('.filters form').submit(group);

$('.filters input').blur(function() {
    $('.filters li:last-of-type').show();
    $(this).hide();
});

$('.filters li:last-of-type').click(addSelector);

function deleteTasks() {
    const visibleElements = $('.list li:visible');
    let hasCompleted = !visibleElements.children('p').hasClass('strike');

    visibleElements.each(function () {
        const el = $(this);
        if (el.data('completed') || hasCompleted) {

            el.fadeOut(() => {
                el.remove();
            })
        }
    })
}

$('.delete').click(deleteTasks)