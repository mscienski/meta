#meta
This grunt plugin is for processing InfoCard metadata for MasterControl.

##Getting Started
Install by adding the SVN repository to svn-npm-crutch under svnDependencies. Run npm install.

```js
grunt.loadNpmTasks('meta');
```

##Config
Inside your `Gruntfile.js` file, require your metadata configuration file.
Example:

```js
var metaConfig = require( './meta.config.js' );
grunt.initConfig(metaConfig);
```

Add a meta task with a named target:

```js
meta: {
  compile: {
    dir: '<%= compile_dir %>/Code'
  }
}
```

###Options

####dir
Folder relative to your Gruntfile where the metadata should be built.

##License
BSD License