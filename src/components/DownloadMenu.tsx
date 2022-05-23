import * as React from 'react';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import DownloadIcon from '@mui/icons-material/Download';
import { Collection } from '../model/Collection';
import {download} from '../controls/CardDB'

class State {
    public anchorEl?: HTMLElement
    public open: boolean = false
}

export default class DownloadMenu extends React.Component<Collection, State>  {

    constructor(props: Collection){
        super(props)
        this.state = new State()
    }

    private handleClick(event: React.MouseEvent<HTMLElement>) {
        this.setState({ ...this.state, anchorEl: event.currentTarget, open: true });
    }
    private handleClose() {
        this.setState({ ...this.state, open: false });
    }

    private clickItem(type: string){
        download(this.props.name, type)
        this.handleClose()
    }

    private downloadURI(uri: string, name: string) {
        var link = document.createElement("a");
        link.download = name;
        link.href = uri;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        link.remove()
      }

    render(): React.ReactNode {
        return (
            <div>
                <Button
                    id="download-menu-open"
                    variant='contained'
                    startIcon={<DownloadIcon />}
                    aria-haspopup="true"
                    onClick={(ev) => this.handleClick(ev)}
                >
                    Download
                </Button>
                <Menu
                    id="download-menu"
                    aria-labelledby="demo-positioned-button"
                    anchorEl={this.state.anchorEl}
                    open={this.state.open}
                    onClose={() => this.handleClose()}
                    anchorOrigin={{
                        vertical: 'top',
                        horizontal: 'left',
                    }}
                    transformOrigin={{
                        vertical: 'top',
                        horizontal: 'left',
                    }}
                >
                    <MenuItem onClick={() => this.clickItem("JSON")}>JSON</MenuItem>
                    <MenuItem onClick={() => this.clickItem("CSV")}>CSV/Excel</MenuItem>
                    <MenuItem onClick={() => this.clickItem("txt-TCGP")}>TCG Player Mass Entry</MenuItem>
                </Menu>
            </div>
        )
    }
}
