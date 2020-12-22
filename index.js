const ubuntu1804 = {
  from: "ubuntu:18.04", // TBD
  env: {
    DEBIAN_FRONTEND: "noninteractive",
    TZ: "Europe/London",
  },
  args: {},
  layers: [],
}

const builtinOptions = {
  "jq": {
    name: "jq",
    apt: ["jq"],
  },

  "aws/cli v1": {
    name: "AWS/Cli v1",
    apt: [
      "awscli",
    ],
  },
  "aws/cli v2": {
    name: "AWS/Cli v2",
    apt: [
      "curl",
      "unzip",
    ],
    lines: [
      {
        run: [
          "curl 'https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip' -o 'awscliv2.zip'",
          "unzip awscliv2.zip",
          "./aws/install"
        ]
      }
    ]
  },
  "terraform 13": {
    name: "Terraform 13",
    args: {
      TERRAFORM_VERSION: "0.13.3",
    },
    apt: [],
    lines: [
      { add: "https://releases.hashicorp.com/terraform/${TERRAFORM_VERSION}/terraform_${TERRAFORM_VERSION}_linux_386.zip /src/${TERRAFORM_VERSION}.zip"},
      { run: "unzip /src/${TERRAFORM_VERSION}.zip -d /usr/local/bin"},
    ]
  },
  "docker": {
    name: "Docker",
    apt: [
      "apt-transport-https",
      "ca-certificates",
      "curl",
      "gnupg-agent",
      "software-properties-common"
    ],
    lines: [
      { run: "curl -fsSL https://download.docker.com/linux/ubuntu/gpg | apt-key add -"},
      { run: 'apt-add-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"' },
      { run: 'apt-get update && apt-get -y install docker-ce docker-ce-cli containerd.io' }
    ]
  },
  "jdk 11": {
    name: "JDK 11",
    apt: ["openjdk-11-jdk"],
  },
  "gradle": {
    name: "Gradle",
    env: {
      GRADLE_HOME: "/gradle-$GRADLE_VERSION",
      PATH: "$GRADLE_HOME/bin:$PATH"
    },
    args: {
      GRADLE_VERSION: "6.6.1"
    },
    apt: ["curl", "unzip"],
    lines: [
      {
        run: ["curl https://services.gradle.org/distributions/gradle-${GRADLE_VERSION}-bin.zip -OJL",
          "unzip gradle-${GRADLE_VERSION}-bin.zip",
          "cp ./gradle-${GRADLE_VERSION}/bin/gradle /usr/local/bin"
        ],
      }
    ]
  }
}

function dockerfile(choices) {
  let extras = choices.map((c) => builtinOptions[c])

  return toDockerfile(ubuntu1804, extras)
}

function toDockerfile(config, choices) {
  let dockerfile = []
  let allArgs = {
    ...config.args,
  }
  let allAptPackages = []
  let lines = []
  let envs = config.env
  for (const pack of choices) {
    allArgs = {...allArgs, ...pack.args}
    if (pack.apt.length) { // track packs thats need 'apt' packages installed
      allAptPackages = allAptPackages.concat([pack])
    }
    lines = lines.concat(pack.lines || [])
    envs = {...envs, ...pack.env}
  }
  dockerfile.push(`FROM ${config.from}`)

  for (const [k, v] of Object.entries(allArgs)) {
    dockerfile.push(`ARG ${k}=${v}`)
  }
  for (const [k, v] of Object.entries(envs)) {
    dockerfile.push(`ENV ${k}=${v}`)
  }

  if (allAptPackages.length) {
    // write a nice comment:
    dockerfile.push(`// for ${allAptPackages.map(pack => pack.name).join(", ")}`)
    dockerfile.push(`RUN apt-get update && apt-get -y install \\\n\t${allAptPackages.flatMap(pack => pack.apt).join(` \\\n\t`)}`)
  }

  for (const line of lines) {
    if (line.add) {
      dockerfile.push(`ADD ${line.add}`)
    }
    if (line.run) {
      if (Array.isArray(line.run)) {
        dockerfile.push(`RUN ${line.run.join(" && \\\n\t")}`)
      } else {
        dockerfile.push(`RUN ${line.run}`)
      }
    }
  }

  return dockerfile
}

// If we are running in the browser, there is no need to go through a module
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    dockerfile,
    toDockerfile,
    ubuntu1804,
  };
}

