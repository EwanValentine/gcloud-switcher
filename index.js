#!/usr/bin/env node

const yaml        = require('js-yaml')
const fs          = require('fs')
const chalk       = require('chalk');
const clear       = require('clear');
const CLI         = require('clui');
const figlet      = require('figlet');
const inquirer    = require('inquirer');
const Preferences = require('preferences');
const Spinner     = CLI.Spinner;
const _           = require('lodash')
const shell = require('shelljs')

clear()

console.log(
  chalk.green(figlet.textSync('Google Cloud Switcher', {
    font: 'Thin',
    horizontalLayout: 'default',
    verticalLayout: 'default'
  }))
)

const loadConfig = (name, file = 'conf.yaml') => {
  console.log(file)
  return new Promise((resolve, _) => {
    const entries = yaml.safeLoad(fs.readFileSync(file, 'utf8'))
    const config = entries.find(config => config.name === name)
    resolve(config)
  })
}

/**
 * Gcloud
 */
function Gcloud() {}

/**
 * switch
 *
 * @param {Object} config
 */
Gcloud.prototype.switch = config => {
  return new Promise((resolve, reject) => {
    console.log(chalk.green(`Setting region to ${config.region}`))
    shell.exec(`gcloud config set compute/zone ${config.region}`)

    console.log(chalk.green(`Setting project to ${config.project}`))
    shell.exec(`gcloud config set project ${config.project}`)

    console.log(chalk.green(`Fetching cluster credentials for cluster: ${config.cluster}`))
    shell.exec(`gcloud beta container clusters get-credentials ${config.cluster}`)

    resolve(true)
  })
}

/**
 * getProject
 *
 * @param {Function} callback
 */
const getProject = callback => {
  const gcloud = new Gcloud()
  const argv = require('minimist')(process.argv.slice(2))

  const questions = [
    {
      name: 'name',
      type: 'input',
      message: 'Enter your Google Cloud Project name',
      validate: value => {
        if (value.length) {
          return true
        }

        return 'Please enter a valid project name'
      }
    },
    {
      name: 'configPath',
      type: 'input',
      default: 'conf.yaml',
      message: 'Enter a file name for your conf.yaml',
      validate: value => {
        if (value.length) {
          return true
        }

        return 'Please enter a valid file path'
      }
    }
  ]

  inquirer.prompt(questions).then(answers => {
    const status = new Spinner('Switching...')
    status.start()
    loadConfig(answers.name, answers.configPath).then(config => {
      gcloud.switch(config).then(res => {
        status.stop()
        callback()
      }).catch(e => {
        status.stop()
        const err = new Error('Failed to switch projects')
        printError(err.message)
      })
    }).catch(e => {
      status.stop()
      const err = new Error('Failed to load config file')
      printError(err.message)
    })
  })
}

/**
 * getProject
 */
getProject(() => {
  console.log(
    chalk.green(figlet.textSync('Done!', {
      font: 'Thin',
      horizontalLayout: 'default',
      verticalLayout: 'default'
    }))
  )
})

const printError = e => {
  console.log(chalk.red(e))
}
