const test = require("uvu").test;
const assert = require("uvu/assert");

const { ubuntu1804, toDockerfile } = require("../index.js");

test("minimal toDockerfile", () => {
  assert.equal(toDockerfile(ubuntu1804, []), [
    "FROM ubuntu:18.04",
    "ENV DEBIAN_FRONTEND=noninteractive",
    "ENV TZ=Europe/London",
  ]);
});

test("adding multiple packages", () => {
  assert.equal(
    toDockerfile(ubuntu1804, [
      { apt: ["jq"], name: "jq" },
      { apt: ["awscli"], name: "AWS/Cli v1" },
    ]),
    [
      "FROM ubuntu:18.04",
      "ENV DEBIAN_FRONTEND=noninteractive",
      "ENV TZ=Europe/London",
      "# for jq, AWS/Cli v1",
      "RUN apt-get update && apt-get -y install \\\n\tjq \\\n\tawscli",
    ]
  );
});

test("removes duplicate apt packages", () => {
  assert.equal(
    toDockerfile(ubuntu1804, [
      { apt: ["jq", "curl"], name: "jq" },
      { apt: ["awscli", "curl"], name: "AWS/Cli v1" },
    ]),
    [
      "FROM ubuntu:18.04",
      "ENV DEBIAN_FRONTEND=noninteractive",
      "ENV TZ=Europe/London",
      "# for jq, AWS/Cli v1",
      "RUN apt-get update && apt-get -y install \\\n\tjq \\\n\tcurl \\\n\tawscli",
    ]
  );
});

test('"run" lines also get a comment as to why they are added', () => {
  assert.equal(
    toDockerfile(ubuntu1804, [
      { name: "Single Line", lines: [{ run: "just one line" }], apt: [] },
      {
        name: "Multipels Lines",
        lines: [{ run: ["one line", "and another"] }],
        apt: [],
      },
    ]),
    [
      "FROM ubuntu:18.04",
      "ENV DEBIAN_FRONTEND=noninteractive",
      "ENV TZ=Europe/London",
      "\n",
      "# for Single Line:",
      "RUN just one line",
      "\n",
      "# for Multipels Lines:",
      "RUN one line && \\\n\tand another",
    ]
  );
});

test.run();
