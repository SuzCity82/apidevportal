import { IInjectorModule, IInjector } from "@paperbits/common/injection";
import { CustomHtmlEditorViewModel } from "./ko/customHtmlEditorViewModel";
import { HTMLInjectionHandlers } from "./customHtmlHandlers";
import { CustomHtmlViewModel, CustomHtmlViewModelBinder } from "./ko";
import { HTMLInjectionModelBinder } from ".";

export class CustomHtmlDesignModule implements IInjectorModule {
    public register(injector: IInjector): void {
        injector.bind("widget", CustomHtmlViewModel);
        injector.bind("widgetEditor", CustomHtmlEditorViewModel);
        injector.bindToCollection("modelBinders", HTMLInjectionModelBinder);
        injector.bindToCollection("viewModelBinders", CustomHtmlViewModelBinder);
        injector.bindToCollection("widgetHandlers", HTMLInjectionHandlers);
    }
}