
const base = {
  from: "ubuntu:18.04", // TBD
  env: {
    DEBIAN_FRONTEND: "noninteractive",
    TZ: "Europe/London",
  },
  args: {},
  layers: [],
}

const options = {
  "jq": {
    apt: ["jq"],
  },

  "aws/cli v1": {
    apt: [
      "awscli",
    ],
  },
  "aws/cli v2": {
    apt: [
      "curl",
      "unzip",
    ],
    args: {},
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
    apt: ["openjdk-11-jdk"],
  },
  "gradle": {
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

function toDockerfile(config, choices) {
  let allArgs = {
    ...config.args,
  }
  let allAptPackages = []
  let lines = []
  let envs = config.env
  for (const choice of choices) {
    const x = options[choice]
    allArgs = {...allArgs, ...x.args}
    allAptPackages = [...allAptPackages, ...x.apt]
    lines = lines.concat(x.lines || [])
    envs = {...envs, ...x.env}
  }
  console.log(`FROM ${config.from}`)

  for (const [k, v] of Object.entries(allArgs)) {
    console.log(`ARG ${k}=${v}`)
  }
  for (const [k, v] of Object.entries(envs)) {
    console.log(`ENV ${k}=${v}`)
  }

  if (allAptPackages.length) {
    console.log(`RUN apt-get update && apt-get -y install \\\n\t${allAptPackages.join(` \\\n\t`)}`)
  }

  for (const line of lines) {
    if (line.add) {
      console.log(`ADD ${line.add}`)
    }
    if (line.run) {
      if (Array.isArray(line.run)) {
        console.log(`RUN ${line.run.join(" && \\\n\t")}`)
      } else {
        console.log(`RUN ${line.run}`)
      }
    }
  }
}

toDockerfile(base, ["gradle", "jdk 11", "docker"])
