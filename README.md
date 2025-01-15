# caret-tilde-remover

Package designed to simplify dependency management by removing caret (^) and tilde (~) version constraints from `package.json` based on information in `package-lock.json`.

It helps ensure more precise and consistent version control, reducing the risk of unexpected updates that can break the project.

With `caret-tilde-remover`, you can easily clean up your dependencies, making your project's version management more straightforward and predictable.

This tool is invaluable for developers aiming to maintain tighter control over their package versions.

## Install

```shell
npm install -g caret-tilde-remover
```

## Usage

Once installed just run the CLI in your project folder with

```shell
ctr
```

or

```shell
caret-tilde-remover
```

This command will print out the `dependencies`, `devDependencies` and/or `peerDependencies` with their actual caret (^) or tilde (~) version and their exact version.

Something like this:

```

        dependencies
 @angular/animations  ~13.3.0  →  13.3.3
 @angular/common      ~13.3.0  →  13.3.3
 ...

        devDependencies
 @angular-devkit/build-angular  ~13.3.2   →  13.3.3
 @angular/cli                   ~13.3.2   →  13.3.3
 ...

Run `ctr -r` to apply these changes
```

In order to remove caret (^) and tilde (~) versions run the following:

```shell
ctr --run
```

or

```shell
ctr -r
```

## Contributing

Please [create an issue](https://github.com/loadko/caret-tilde-remover/issues/new) if you have a bug report, feature proposal, or you have a question. If you like this project, please consider giving it a star ⭐ to support my work.

## License

This project is licensed under the [GPLv3 license](https://www.gnu.org/licenses/gpl.html).

Copyright © 2023 Loredan Adrian Konyicska

<details><summary>License notice</summary>
<p>

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program. If not, see <http://www.gnu.org/licenses/>.

The full text of the license is available in the [LICENSE](LICENSE.md) file in this repository and [online](https://www.gnu.org/licenses/gpl.html).

</details>
