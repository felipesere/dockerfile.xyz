const test = require('uvu').test;
const assert = require('uvu/assert');

const { ubuntu1804, toDockerfile } = require('../index.js');

test('minimal toDockerfile', () => {
  assert.equal(toDockerfile(ubuntu1804, []), [
    'FROM ubuntu:18.04',
    'ENV DEBIAN_FRONTEND=noninteractive',
    'ENV TZ=Europe/London'
  ])
});

test('just adding a package to install', () => {
  assert.equal(toDockerfile(ubuntu1804, [
    {apt: ['jq']}
  ]), [
    'FROM ubuntu:18.04',
    'ENV DEBIAN_FRONTEND=noninteractive',
    'ENV TZ=Europe/London',
    'RUN apt-get update && apt-get -y install \\\n\tjq'
  ])
});

test('adding multiple packages', () => {
  assert.equal(toDockerfile(ubuntu1804, [
    {apt: ['jq']},
    {apt: ['awscli']}
  ]), [
    'FROM ubuntu:18.04',
    'ENV DEBIAN_FRONTEND=noninteractive',
    'ENV TZ=Europe/London',
    'RUN apt-get update && apt-get -y install \\\n\tjq \\\n\tawscli'
  ])
});

test.run();
