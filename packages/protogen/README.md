# protogen
A type generator that works with Zod

## CLI

Arguments:
 - -i --input - input file
 - -l --load-plugin - load plugin module - The exported members can be used as readers, parsers, generators or writers.
 - -o --output - output destination. Can be a filename or directory. If a directory a default filename will be generated
 - -r --reader - reader name - default - "fileReader"
 - -p --parser - parser name - default - "lucidCsvParser"
 - -g --generator - generator name - default - "zodGenerator"
 - -w --writer - writer name - default = "fileWriter"
 - --no-default-plugins - If set the default plugins will not be used

All other flags can be used by plugins.

Values to not preceded with a flag are used as inputs.
