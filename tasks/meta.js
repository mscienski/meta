/*
 * meta
 */

'use strict';

module.exports = function(grunt) {
  var path = require('path');

  var processMappings = function(mapping, source, dest, values) {
    var from = mapping.name.split('_')[0];
    var to = mapping.name.split('_')[1];

    grunt.file.copy(source, dest + from + '_' + to + '.xml', {
      process: function(contents, filePath) {
        return grunt.template.process( contents, {
          data: {
            fromName: from,
            toName: to,
            mappings: mapping.fields,
            templateName: values.spName
          }
        });
      }
    });
  };

  var processTemplateInfocard = function(source, dest, values) {
    grunt.file.copy(source, dest, {
      process: function(contents, filePath) {
        return grunt.template.process( contents, {
          data: {
            fileName: values.spName,
            spName: values.spName,
            numPages: values.numPages
          }
        });
      }
    });
  };

  var processNumbering = function(source, dest, values) {
    grunt.file.copy(source, dest, {
      process: function(contents, filePath) {
        return grunt.template.process( contents, {
          data: {
            description: values.description,
            numbering: values.numbering,
            type: values.type,
            subtype: values.subtype
          }
        });
      }
    });
  };

  var processInfoCardType = function(source, dest, values) {
    grunt.file.copy(source, dest, {
      process: function(contents, filePath) {
        return grunt.template.process( contents, {
          data: {
            type: values.type,
            description: values.description,
            name: values.name
          }
        });
      }
    });
  };

  var processVault = function(source, dest, values) {
    grunt.file.copy(source, dest, {
      process: function(contents, filePath) {
        return grunt.template.process( contents, {
          data: {
            description: values.description
          }
        });
      }
    });
  };

  var processLifecycle = function(source, dest, values) {
    if (values.isComplex) {
      grunt.log.subhead('WARNING'.red);
      grunt.log.writeln('The lifecycle xml will not be filled out for you.'.yellow);
      grunt.log.writeln('A sample complex lifecycle template has been created.'.yellow);
      grunt.log.writeln('Please edit the lifecycle xml output to meet your complex lifecycle needs.'.yellow);
    }
    grunt.file.copy(source, dest, {
      process: function(contents, filePath) {
        return grunt.template.process( contents, {
          data: {
            isComplex: values.isComplex,
            description: values.description,
            draft: values.draft,
            release: values.release,
            archive: values.archive
          }
        });
      }
    });
  };

  var processRoles = function(source, destPath, values) {
    grunt.log.writeln('Processing Roles'.green);
    grunt.log.writeln('Role right must be edited manually. Please edit output role xml files to assign rights.'.yellow);

    values.roles.forEach(function(role) {
      role.vaults.forEach(function(vault) {
        var spVaults = grunt.config('metadata.solutionpackage.vaults');
        var templateVaults = grunt.config('metadata.formTemplate.vaults');

        var spMissing = Object.keys(spVaults).every(function(key, i, arr) {
          if(spVaults[key] === vault) {
            return false
          }
          return true;
        });

        var templateMissing = Object.keys(templateVaults).every(function(key, i, arr) {
         if(templateVaults[key] === vault) {
          return false;
         }
         return true;
        });

        //console.log(vault + ' ' + spMissing + ' ' + templateMissing);

        if (spMissing && templateMissing && role.vaults.length > 0) {
          grunt.warn('A vault in '.red + role.vaults.toString() + ' defined for the role '.red + role.id + ' does not exist as a defined vault for either the form or the form template. Please check configuration.'.red);
        }
      });
      grunt.file.copy(source, destPath + role.id + '.xml', {
        process: function(contents, filePath) {
          return grunt.template.process( contents, {
            data: {
              description: values.description,
              vaults: role.vaults
            }
          });
        }
      });
    });
  };

  var processRoute = function(source, dest, values) {
    var pageArr = [];
    for (var i=1; i<=values.numPages; i++) {
      pageArr.push(i);
    }
    values.owners.forEach(function(owner) {
      var missing = (function() {
        return grunt.config('metadata.roles').every(function(definedRole) {
          if(definedRole.id === owner) {
            return false;
          }
          return true;
        });
      })();
      if (missing) {
        grunt.warn('The '.red + owner + ' owner defined for the route does not exist as a role in the configuration. Please check configuration.'.red);
      }
    });
    values.roles.forEach(function(role) {
      var missing = (function() {
        return grunt.config('metadata.roles').every(function(definedRole) {
          if(definedRole.id === role) {
            return false;
          }
          return true;
        });
      })();

      if(missing) {
        grunt.warn('The '.red + role +' role defined for the route does not exist as a role in the configuration. Please check configuration.'.red);
      }
    });

    values.steps.forEach(function(step) {
      if (step.type.toLowerCase() !== 'notify' && ((step.pages.length + step.readonlypages.length) !== values.numPages)) {
        if ((step.pages.length + step.readonlypages.length) > values.numPages) {
          grunt.warn('The number of pages and readonly pages on step id='.red + step.id + ' combined is greated than the total number of pages in the form. Please check configuration'.red);
        } else {
          var missingPageArr = [];
          for(var i=1; i<=values.numPages; i++) {
            if (step.pages.indexOf(i) === -1 && step.readonlypages.indexOf(i) === -1) {
              missingPageArr.push(i);
            }
          }
          grunt.log.subhead('POTENTIAL PAGE MISMATCH'.red)
          grunt.log.error('The number of pages defined for editable pages and readonly pages combined doesn\'t match the total number of pages in the form.'.yellow);
          grunt.log.error('The following pages will be hidden on step id='.yellow + step.id + ': '.yellow + missingPageArr.toString());
          grunt.log.error('If this isn\'t correct, please check configuration.'.yellow)
        }
      }

      if (step.type.toLowerCase() === 'approval' && step.pages.length > 0) {
        grunt.warn('Editable pages may not be defined for the approval step id='.red + step.id + '. Please check configuration.'.red);
      }
    });

    grunt.file.copy(source, dest, {
      process: function(contents, filePath) {
        return grunt.template.process( contents, {
          data: {
            templateName: values.templateName,
            description: values.description,
            numbering: values.numbering,
            abortVault: values.abortVault,
            owners: values.owners,
            roles: values.roles,
            steps: values.steps
          }
        });
      }
    });
  };

  grunt.registerMultiTask( 'meta', 'Process metadata configuration files', function() {
    var dest = this.data.dir;
    var spName = grunt.config('metadata.solutionpackage.name') || grunt.config('pkg.name');
    var description = grunt.config('metadata.solutionpackage.description') || grunt.config('pkg.description');
    var descVersion = grunt.config('metadata.mastercontrol.wildcardVersion') || grunt.config('metadata.mastercontrol.version');

    var pageRe = new RegExp('(mcPage_)','g');
    var matchArr = [], numPages = 0;
    while ((matchArr = pageRe.exec(grunt.file.read(grunt.config('app_files.html')))) !== null) {
      numPages++;
    }

    grunt.file.copy(grunt.file.expand(grunt.config('meta_files.version')),dest+'/version-'+grunt.config('metadata.mastercontrol.version') +'.txt');
    grunt.file.copy(grunt.file.expand(grunt.config('compile_dir')+'/'+path.basename(grunt.file.expand(grunt.config('app_files.html')))),dest+'/files/'+spName+'.html');
    grunt.file.expand(grunt.config('meta_files.data_structures')).forEach(function(file) {
      if (file.toLowerCase().indexOf('sp_trans') !== -1) {
        grunt.file.copy(file,dest+'/data_structures/SP_TRANS_'+spName+path.extname(file));
      } else {
        grunt.file.copy(file,dest+'/data_structures/SP_CFG_'+spName+'_'+path.basename(file));
      }
    });

    grunt.config('metadata.mappings.agent').forEach(function(agentmap) {
      var src = grunt.file.expand(grunt.config('meta_files.agent_mappings'));
      processMappings(agentmap, src, dest + '/agent_mappings/', {
        spName: spName
      });
    });
    grunt.config('metadata.mappings.event').forEach(function(eventmap){ 
      var src = grunt.file.expand(grunt.config('meta_files.event_mappings'));
      processMappings(eventmap, src, dest + '/event_mappings/', {
        spName: spName
      });
    });
    processTemplateInfocard(grunt.file.expand(grunt.config('meta_files.template_infocard')), dest + '/templates/' + spName +'.xml', {
      spName: spName, 
      numPages: numPages
    });
    processNumbering(grunt.file.expand(grunt.config('meta_files.numbering')), dest + '/numbering_series/SP Form - Imported.xml', {
      description: description + ' ' + descVersion,
      numbering: grunt.config('metadata.formTemplate.numbering'),
      type: 'Form Template',
      subtype: grunt.config('metadata.formTemplate.type')
    });
    processNumbering(grunt.file.expand(grunt.config('meta_files.numbering')), dest + '/numbering_series/' + spName + ' Form.xml', {
      description: description + ' ' + descVersion,
      numbering: grunt.config('metadata.solutionpackage.numbering'),
      type: 'Form',
      subtype: spName
    });
    processInfoCardType(grunt.file.expand(grunt.config('meta_files.infocard_type')), dest + '/infocard_types/' + spName + '.xml', {
      type: grunt.config('metadata.solutionpackage.infocardType'),
      name: spName,
      description: description + ' ' + descVersion
    });
    processInfoCardType(grunt.file.expand(grunt.config('meta_files.infocard_type')), dest + '/infocard_types/' + grunt.config('metadata.formTemplate.type') + '.xml', {
      type: grunt.config('metadata.formTemplate.infocardType'),
      name: grunt.config('metadata.formTemplate.type'),
      description: description + ' ' + descVersion
    });

    var spVaults = grunt.config('metadata.solutionpackage.vaults');
    Object.keys(spVaults).forEach(function(name) {
      processVault(grunt.file.expand(grunt.config('meta_files.vault')), dest + '/vaults/' + spVaults[name] + '.xml', {
        description: description + ' ' + descVersion
      });
    });

    var templateVaults = grunt.config('metadata.formTemplate.vaults');
    Object.keys(templateVaults).forEach(function(name) {
      processVault(grunt.file.expand(grunt.config('meta_files.vault')), dest + '/vaults/' + templateVaults[name] + '.xml', {
        description: description + ' ' + descVersion
      });
    });

    processLifecycle(grunt.file.expand(grunt.config('meta_files.lifecycle')), dest + '/life_cycles/' + grunt.config('metadata.solutionpackage.lifecycle.name')+'.xml', {
      isComplex: grunt.config('metadata.solutionpackage.lifecycle.complex'),
      description: description + ' ' + descVersion,
      draft: grunt.config('metadata.solutionpackage.vaults.draft'),
      release: grunt.config('metadata.solutionpackage.vaults.release'),
      archive: grunt.config('metadata.solutionpackage.vaults.archive')
    });

    processLifecycle(grunt.file.expand(grunt.config('meta_files.lifecycle')), dest + '/life_cycles/' + grunt.config('metadata.formTemplate.lifecycle.name')+'.xml', {
      isComplex: grunt.config('metadata.formTemplate.lifecycle.complex'),
      description: description + ' ' + descVersion,
      draft: grunt.config('metadata.formTemplate.vaults.draft'),
      release: grunt.config('metadata.formTemplate.vaults.release'),
      archive: grunt.config('metadata.formTemplate.vaults.archive')
    });

    processRoute(grunt.file.expand(grunt.config('meta_files.route')), dest + '/routes/' + spName + '.xml', {
      templateName: spName,
      description: description + ' ' + descVersion,
      numbering: spName +' Form',
      abortVault: grunt.config('metadata.solutionpackage.vaults.abort'),
      owners: grunt.config('metadata.solutionpackage.route.owners'),
      roles: grunt.config('metadata.solutionpackage.route.roles'),
      steps: grunt.config('metadata.solutionpackage.route.steps'),
      numPages: numPages
    });

    processRoles(grunt.file.expand(grunt.config('meta_files.role')), dest+ '/roles/', {
      description: description + ' ' + descVersion,
      roles: grunt.config('metadata.roles')
    });
  });
};