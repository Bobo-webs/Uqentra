(function ($) {
    "use strict";

    $.fn.countUp = function (options) {

        // Defaults
        var settings = $.extend({
            'time': 2000,
            'delay': 10
        }, options);

        return this.each(function () {

            // Store the object
            var $this = $(this);
            var $settings = settings;

            var counterUpper = function () {
                if (!$this.data('counterupTo')) {
                    $this.data('counterupTo', $this.text());
                }

                // NEW: support for prefix and suffix via data attributes
                var prefix = $this.data('prefix') || '';
                var suffix = $this.data('suffix') || '';

                var time = parseInt($this.data("counter-time")) > 0 ? parseInt($this.data("counter-time")) : $settings.time;
                var delay = parseInt($this.data("counter-delay")) > 0 ? parseInt($this.data("counter-delay")) : $settings.delay;
                var divisions = time / delay;

                // Get the raw numeric part (strip prefix/suffix and commas)
                var numStr = $this.data('counterupTo')
                    .replace(prefix, '')
                    .replace(suffix, '')
                    .replace(/,/g, '')
                    .trim();

                var num = parseFloat(numStr);
                if (isNaN(num)) num = 0;

                var isComma = /[0-9]+,[0-9]+/.test($this.data('counterupTo'));
                var isInt = Number.isInteger(num);
                var isFloat = !isInt && num.toString().indexOf('.') !== -1;
                var decimalPlaces = isFloat ? (num.toString().split('.')[1] || []).length : 0;

                // Generate list of incremental numbers to display
                var nums = [];
                for (var i = divisions; i >= 1; i--) {
                    var newNum;

                    if (isInt) {
                        newNum = Math.round(num / divisions * i);
                    } else if (isFloat) {
                        newNum = parseFloat((num / divisions * i).toFixed(decimalPlaces));
                    } else {
                        newNum = 0;
                    }

                    // Add commas back if original had them
                    var displayNum = newNum;
                    if (isComma) {
                        displayNum = displayNum.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
                    }

                    // Apply prefix and suffix
                    nums.unshift(prefix + displayNum + suffix);
                }

                $this.data('counterup-nums', nums);
                $this.text(prefix + '0' + suffix);  // start display

                // Updates the number until we're done
                var f = function () {
                    if ($this.data('counterup-nums') && $this.data('counterup-nums').length) {
                        $this.text($this.data('counterup-nums').shift());
                        setTimeout($this.data('counterup-func'), delay);
                    } else {
                        // Final value (safety)
                        var finalNum = isInt ? Math.round(num) : num.toFixed(decimalPlaces);
                        if (isComma) {
                            finalNum = finalNum.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
                        }
                        $this.text(prefix + finalNum + suffix);

                        delete $this.data('counterup-nums');
                        $this.data('counterup-nums', null);
                        $this.data('counterup-func', null);
                    }
                };

                $this.data('counterup-func', f);

                // Start the count up
                setTimeout($this.data('counterup-func'), delay);
            };

            // Perform counts when the element gets into view
            $this.waypoint(counterUpper, { offset: '100%', triggerOnce: true });
        });

    };

})(jQuery);