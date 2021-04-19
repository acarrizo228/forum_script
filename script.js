// ==UserScript==
// @name         Auto-responses
// @namespace    https://forum.blackrussia.online
// @version      1.0
// @description  try to take over the world!
// @author       Carrizo
// @match        https://forum.blackrussia.online/index.php?threads/*
// @include      https://forum.blackrussia.online/index.php?threads/
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  const CLOSE_PREFIX = 15; // Prefix that will be set when thread closes
  const PIN_PREFIX = 17; // Prefix that will be set when thread pins
  const buttons = [
    {
      title: 'Приветствие',
      content:
        '[FONT=Courier New][CENTER]{{ greeting }}, {{ user.mention }}[/CENTER]<br>' + '[CENTER]  [/CENTER][/FONT]',
    },
    {
      title: 'Выдано верно',
      content:
        '[FONT=Courier New][CENTER]{{ greeting }}, {{ user.mention }}[/CENTER]<br>' +
        '[CENTER]Наказание выдано верно,   .[/CENTER]<br>' +
        '[CENTER]Закрыто.[/CENTER][/FONT]',
    },
  ];

  $(document).ready(() => {
    // Загрузка скрипта для обработки шаблонов
    $('body').append('<script src="https://cdn.jsdelivr.net/npm/handlebars@latest/dist/handlebars.js"></script>');

    // Добавление кнопок при загрузке страницы
    addButton('Выбрать ответ', 'selectAnswer');
    addButton('На рассмотрение', 'pin');
    addButton('Рассмотрено', 'close');

    // Поиск информации о теме
    const threadData = getThreadData();

    $('button#close').click(() => editThreadData(CLOSE_PREFIX, false, true));
    $('button#pin').click(() => editThreadData(PIN_PREFIX, true, false));

    $(`button#selectAnswer`).click(() => {
      XF.alert(buttonsMarkup(buttons), null, 'Выберите ответ:');
      buttons.forEach((btn, id) => {
        $(`button#answers-${id}`).click(() => pasteContent(id, threadData));
      });
    });
  });

  function addButton(name, id) {
    $('.button--icon--reply').after(
      `<button type="button" class="button rippleButton" id="${id}" style="margin: 3px;">${name}</button>`,
    );
  }

  function buttonsMarkup(buttons) {
    return `<div class="select_answer">${buttons
      .map(
        (btn, i) =>
          `<button id="answers-${i}" class="button--primary button ` +
          `rippleButton" style="margin:5px"><span class="button-text">${btn.title}</span></button>`,
      )
      .join('')}</div>`;
  }

  function pasteContent(id, data = {}) {
    const template = Handlebars.compile(buttons[id].content);
    if ($('.fr-element.fr-view p').text() === '') $('.fr-element.fr-view p').empty();

    $('span.fr-placeholder').empty();
    $('div.fr-element.fr-view p').append(template(data));
    $('a.overlay-titleCloser').trigger('click');
  }

  function getThreadData() {
    const authorID = $('a.username')[0].attributes['data-user-id'].nodeValue;
    const authorName = $('a.username').html();
    const hours = new Date().getHours();
    return {
      user: {
        id: authorID,
        name: authorName,
        mention: `[USER=${authorID}]${authorName}[/USER]`,
      },
      greeting: () =>
        4 < hours && hours <= 11
          ? 'Доброе утро'
          : 11 < hours && hours <= 15
          ? 'Добрый день'
          : 15 < hours && hours <= 21
          ? 'Добрый вечер'
          : 'Доброй ночи',
    };
  }

  function editThreadData(prefix, pin = false, close = false) {
    // Получаем заголовок темы, так как он необходим при запросе
    const threadTitle = $('.p-title-value')[0].lastChild.textContent;

    fetch(`${document.URL}edit`, {
      method: 'POST',
      body: getFormData({
        prefix_id: prefix,
        title: threadTitle,
        discussion_open: !close,
        sticky: pin,
        _xfToken: XF.config.csrf,
        _xfRequestUri: document.URL.split(XF.config.url.fullBase)[1],
        _xfWithData: 1,
        _xfResponseType: 'json',
      }),
    }).then(() => location.reload());
  }

  function getFormData(data) {
    const formData = new FormData();
    Object.entries(data).forEach(i => formData.append(i[0], i[1]));
    return formData;
  }
})();
