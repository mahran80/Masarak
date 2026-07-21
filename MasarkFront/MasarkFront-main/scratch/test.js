const str = "{{ 'AUTO.KEY_753' | translate }} <br> [title]=\"'AUTO' | translate\" {{ 'X' | translate:param }}";
console.log(str.replace(/\s*\|\s*translate(:[^\s}"\']*)?/g, ''));
