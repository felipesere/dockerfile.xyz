const test = require('uvu').test;
const assert = require('uvu/assert');

const { ubuntu1804, toDockerfile } = require('../index.js');

test('minimal dockerfile', () => {
  assert.equal(toDockerfile(ubuntu1804, []), [
    'FROM ubuntu:18.04',
    'ENV DEBIAN_FRONTEND=noninteractive',
    'ENV TZ=Europe/London'
  ])
});

test('just adding a package to install', () => {
  assert.equal(toDockerfile(ubuntu1804, ['jq']), [
    'FROM ubuntu:18.04',
    'ENV DEBIAN_FRONTEND=noninteractive',
    'ENV TZ=Europe/London',
    'RUN apt-get update && apt-get -y install \\\n\tjq'
  ])
});

test('adding multiple packages', () => {
  assert.equal(toDockerfile(ubuntu1804, ['jq', 'aws/cli v1']), [
    'FROM ubuntu:18.04',
    'ENV DEBIAN_FRONTEND=noninteractive',
    'ENV TZ=Europe/London',
    'RUN apt-get update && apt-get -y install \\\n\tjq \\\n\tawscli'
  ])
});

test.run();
